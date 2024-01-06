---
external: false
title: Pulumi, A Beginner's Experience
description: As part of a project to (over)engineer a system for Role-Based Access Control used for administrative tasks and back-office operations, I've decided to go with building reproducible and portable infrastructure leveraging infrastructure-as-code (IaC) tools.
# ogImagePath:
date: 2023-12-23
featured: true
---

## Context

As part of a project to (over)engineer a system for Role-Based Access Control used for administrative tasks and back-office operations, I've decided to go with building reproducible and portable infrastructure leveraging infrastructure-as-code (IaC) tools.

I chose to use [Pulumi](https://www.pulumi.com/product/internal-developer-platforms/) as the IaC of choice over the well-known [Terraform by HashiCorp](https://www.terraform.io/) in hopes to gain a deeper understanding of Pulumi after having first come into contact with it on a separate project months ago and having had a great impression of it.

### Pulumi

#### How Pulumi works

Before diving further into this article, I would highly recommend having some understanding of Pulumi concepts like [how Pulumi works](https://www.pulumi.com/docs/concepts/how-pulumi-works/) and [using Pulumi](https://www.pulumi.com/docs/using-pulumi/) which are both well documented.

In summary, new resources are declared using Pulumi by running `pulumi up` which triggers the Pulumi engine to perform a check on the current state on the state backend, determine what resources needs to be modified, perform the necessary API calls to those providers to change the resource state and finally, update the state backend of this new state.

#### Pulumi Backend

To make things easier for state storing without reliance on Pulumi cloud (mainly for portability reasons), we'd decided to use [S3 as our main Pulumi state backend](https://www.pulumi.com/docs/concepts/state/#aws-s3).

### The Design

A simplified view of the planned AWS Architecture Diagram:

![architecture-diagram](/images/blog/pulumi-a-beginners-experience/architecture-diagram.png)

The above design uses the following services:

- [Route53](https://aws.amazon.com/route53) to route traffic between a primary region and secondary replica region
- [ALB](https://aws.amazon.com/elasticloadbalancing/application-load-balancer) to spread traffic between 2 availability zones within a particular region
- Another internal-facing [ALB](https://aws.amazon.com/elasticloadbalancing/application-load-balancer) to spread traffic across replicas of downstream microservices
- [ECS](https://aws.amazon.com/ecs) to orchestrate the containerized application on top of [EC2](https://aws.amazon.com/ec2) compute instances
- [RDS](https://aws.amazon.com/rds) as the main database service running Postgres@15
- [Lambda](https://aws.amazon.com/lambda/) for simple log recording tasks
- [SQS](https://aws.amazon.com/sqs/) to enable asynchronous log entries
- Various network configurations with [VPCs](https://aws.amazon.com/vpc), Subnets and Security Groups

Our goal is to sufficiently replicate services within the regional construct such that on the event that the secondary region is promoted to the primary, a tertiary region can be spun up and take over as the secondary region while the original primary region remains inactive for maintenance or other purposes.

### Design Considerations

In order to establish services that can be easily ported over to multiple regions, we would ideally want to group configurations specific to regional services together and global services separately, following the [Micro-Stacks](https://www.pulumi.com/docs/using-pulumi/organizing-projects-stacks/#micro-stacks) Pulumi project organization pattern.

Here's what we started with initially:

```sh
❯ tree pulumi -L 3
pulumi/
├── README.md
├── global/
│   ├── __main__.py
│   ├── Pulumi.yaml
│   ├── Pulumi.main.yaml
│   └── requirements.txt
├── database/
│   ├── __main__.py
│   ├── Pulumi.yaml
│   ├── Pulumi.main.yaml
│   └── requirements.txt
├── primary/
│   ├── __main__.py
│   ├── Pulumi.yaml
│   ├── Pulumi.main.yaml
│   └── requirements.txt
└── secondary/
    ├── __main__.py
    ├── Pulumi.yaml
    ├── Pulumi.main.yaml
    └── requirements.txt
```

The original intention was to separate concerns for the primary and secondary regions apart from the global and database services. This is accomplished by leveraging Pulumi Projects for each of the `global`, `database`, `primary` and `secondary` specific infrastructure setups.

We quickly realized that it was silly to separate the primary and secondary regions as they largely contain the same configurations of the same types of services and it'll just be repetitive to have a `secondary` on top of the already existing `primary` when we could have just used a different Pulumi stack within the a single project with differently defined parameters like the target AWS Region.

Another thing that was somewhat unnecessary was the separation of `database` and `global` since `global` was intended to be a shared configuration across AWS regions and the kind of configuration for RDS perfectly fits that in nature, even though it is technically a regional service.

We now end up with a project structure similar to the following:

```sh
❯ tree pulumi -d -L 3
pulumi/
├── global/
│   ├── network/
│   ├── rds/
│   ├── route53/
│   ├── __main__.py
│   ├── Pulumi.yaml
│   ├── Pulumi.main.yaml
│   └── requirements.txt
└── regional/
    ├── ecs/
    │   ├── service-A/
    │   ├── service-B/
    │   └── service-C/
    ├── lb/
    ├── network/
    ├── serverless/
    ├── __main__.py
    ├── Pulumi.yaml
    ├── Pulumi.sin.yaml
    ├── Pulumi.hkg.yaml
    └── requirements.txt
```

With the `regional` containing 2 stacks to stores the main configuration for the primary region in Singapore (`./pulumi/regional/Pulumi.sin.yaml`) and the secondary region in Hong Kong (`./pulumi/regional/Pulumi.hkg.yaml`).

```sh
❯ cat ./pulumi/regional/Pulumi.sin.yaml
encryptionsalt: v1:xxxxxx
config:
  aws:region: ap-southeast-1
```

With an additional logical separation of related services like for `ecs` within the `regional` Pulumi
project.

## A Deeper Look

> ‼️ NOTE: _The various code snippets shown below are written by a beginner (unless labelled otherwise) and are meant to be references - use at your own risk!_

### Structure of Code

In the Global component of code, we define the key resources that are available and used actively across regions, and shouldn't be modified frequently, such as the Route53 and various network related configurations.

```sh
❯ tree pulumi/global -L 2
pulumi/global/
├── Pulumi.dev.yaml
├── Pulumi.yaml
├── __main__.py
├── network/
│   └── __init__.py
├── rds/
│   └── __init__.py
├── requirements.txt
└── route53/
    └── __init__.py
```

Defining network resources would look something like:

```python
# source: pulumi/global/network/__init__.py
import pulumi_aws as aws
import pulumi

config = pulumi.Config()
regions = config.require_object("regions")

if len(regions) != 2:
    raise Exception("This stack requires exactly two regions to be configured")

def create_vpc(cidr: str, region: str, provider: aws.Provider) -> aws.ec2.Vpc:
    return aws.ec2.Vpc(
        f"main-{region.replace('-', '_')}",
        cidr_block=cidr,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        opts=pulumi.ResourceOptions(provider=provider),
    )

def create_subnet(
    vpc: aws.ec2.Vpc,
    cidr: str,  # e.g. "10.0.0.8/24"
    az: str,  # e.g. "ap-southeast-1a"
    provider: aws.Provider,
    is_public: bool = False,
) -> aws.ec2.Subnet:
    name = f"subnet-{az.replace('-', '_')}-{'public' if is_public else 'private'}"
    return aws.ec2.Subnet(
        name,
        vpc_id=vpc.id,
        cidr_block=cidr,
        availability_zone=az,
        map_public_ip_on_launch=is_public,
        opts=pulumi.ResourceOptions(provider=provider),
    )

def create_security_group(
    name: str,
    vpc: aws.ec2.Vpc,
    provider: aws.Provider,
) -> aws.ec2.SecurityGroup:
    return aws.ec2.SecurityGroup(
        name,
        vpc_id=vpc.id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                self=False,
                cidr_blocks=["0.0.0.0/0"],
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
            )
        ],
        opts=pulumi.ResourceOptions(provider=provider),
    )


for region in regions:
    provider = aws.Provider(f"provider_{region}", region=region)
    vpc = create_vpc("10.0.0.0/16", region, provider)
    sg = create_security_group(f"ecs-security-group_{region}", vpc, provider)
    public_subnet_az_a = create_subnet(vpc, "10.0.1.0/24", f"{region}a", provider, True)
    private_subnet_az_a = create_subnet(vpc, "10.0.11.0/24", f"{region}a", provider)
    public_subnet_az_b = create_subnet(vpc, "10.0.2.0/24", f"{region}b", provider, True)
    private_subnet_az_b = create_subnet(vpc, "10.0.12.0/24", f"{region}b", provider)
    internet_gateway = aws.ec2.InternetGateway(
        f"internet-gateway_{region}",
        vpc_id=vpc.id,
        opts=pulumi.ResourceOptions(provider=provider),
    )
    route_table = aws.ec2.RouteTable(
        f"route-table_{region}",
        vpc_id=vpc.id,
        routes=[
            aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0", gateway_id=internet_gateway.id
            )
        ],
        opts=pulumi.ResourceOptions(provider=provider),
    )
    public_subnet_route_table_association_az_a = aws.ec2.RouteTableAssociation(
        f"public_subnet_route_table_association_az_a_{region}",
        subnet_id=public_subnet_az_a.id,
        route_table_id=route_table.id,
        opts=pulumi.ResourceOptions(provider=provider),
    )
    public_subnet_route_table_association_az_b = aws.ec2.RouteTableAssociation(
        f"public_subnet_route_table_association_az_b_{region}",
        subnet_id=public_subnet_az_b.id,
        route_table_id=route_table.id,
        opts=pulumi.ResourceOptions(provider=provider),
    )

    pulumi.export(f"{region}:vpcId", vpc.id)
    pulumi.export(f"{region}:publicSubnetAzAId", public_subnet_az_a.id)
    pulumi.export(f"{region}:publicSubnetAzBId", public_subnet_az_b.id)
    pulumi.export(f"{region}:privateSubnetAzAId", private_subnet_az_a.id)
    pulumi.export(f"{region}:privateSubnetAzBId", private_subnet_az_b.id)
    pulumi.export(f"{region}:sgId", sg.id)
```

> _Looking back, the code structure could definitely be a lot cleaner, but for a first time effort and built in favor for quick iteration, this was what we ended up with._

The main motivation of adopting such a structure is the logical hierarchy of the provisioned resources as it now becomes clear which subfolders is responsible for which resources on AWS.

### Handling Secrets

Secrets sharing is a common workflow especially among team members. For this particular project, I find the use of the [built-in secrets management](https://www.pulumi.com/docs/concepts/secrets/) _(see also [Managing Secrets with Pulumi | Pulumi Blog](https://www.pulumi.com/blog/managing-secrets-with-pulumi/))_ to be more than sufficient for our use case.

For example, to define a shared database secret, all we need to do is define it in the stack configuration as a secret by running a command, which sets a configuration variable named `dbPassword` to the plaintext value `verySecurePassword!`:

```sh
❯ pulumi config set --secret dbPassword "verySecurePassword!"
```

If we list the configuration for our stack, the plaintext value for `dbPassword` will not be printed:

```sh
❯ pulumi config
KEY                        VALUE
aws:region                 ap-southeast-1
dbPassword                 [secret]
```

Similarly, if the program attempts to print the value of `dbPassword` to the console - either intentionally or accidentally - Pulumi will mask it out:

```python
import pulumi
config = pulumi.Config()
print('Password: {}'.format(config.require('dbPassword')))
```

Running this program yields the following result:

```sh
❯ pulumi up
Password: [secret]
```

For further information on handling secrets, see the comprehensive [Pulumi documentation on secrets](https://www.pulumi.com/docs/concepts/secrets/#using-configuration-and-secrets-in-code).

A simple example of how this would look like in practical code would be:

```python
# source: pulumi/global/rds/__init__.py
from network import NetworkResources, region_resources
import pulumi_aws as aws
import pulumi

config = pulumi.Config()
regions = config.require_object("regions")
retention_period = config.get_int("retentionPeriod") or 7

db_user = config.require_secret("dbUser")
db_password = config.require_secret("dbPassword")

primary_provider = aws.Provider("primaryProvider", region=regions[0])
replica_provider = aws.Provider("replicaProvider", region=regions[1])

primary_region_resources: NetworkResources = list(
    filter(lambda r: r.region == regions[0], region_resources)
)[0]

secondary_region_resources: NetworkResources = list(
    filter(lambda r: r.region == regions[1], region_resources)
)[0]

# Create the primary RDS database instance.
primary_db_subnet_grp = aws.rds.SubnetGroup(
    "primary_db_subnet_grp",
    subnet_ids=[
        primary_region_resources.private_subnet_az_a.id,
        primary_region_resources.private_subnet_az_b.id,
    ],
    opts=pulumi.ResourceOptions(provider=primary_provider),
)
primary_db = aws.rds.Instance(
    "primary",
    allocated_storage=10,
    engine="postgres",
    engine_version="15",
    instance_class="db.t3.micro",
    username=db_user,
    password=db_password,
    backup_retention_period=retention_period,
    skip_final_snapshot=True,
    multi_az=True,
    vpc_security_group_ids=[primary_region_resources.sg.id],
    db_subnet_group_name=primary_db_subnet_grp.name,
    opts=pulumi.ResourceOptions(provider=primary_provider),
)

# Secondary read replica database in different region.
secondary_db_subnet_grp = aws.rds.SubnetGroup(
    "secondary_db_subnet_grp",
    subnet_ids=[
        secondary_region_resources.private_subnet_az_a.id,
        secondary_region_resources.private_subnet_az_b.id,
    ],
    opts=pulumi.ResourceOptions(provider=replica_provider),
)

secondary_db = aws.rds.Instance(
    "secondary",
    instance_class="db.t3.micro",
    replicate_source_db=primary_db.arn,
    backup_retention_period=retention_period,
    skip_final_snapshot=True,
    vpc_security_group_ids=[secondary_region_resources.sg.id],
    db_subnet_group_name=secondary_db_subnet_grp.name,
    opts=pulumi.ResourceOptions(provider=replica_provider),
)

pulumi.export("dbEndpointPrimary", primary_db.endpoint)
pulumi.export("dbEndpointSecondary", secondary_db.endpoint)
pulumi.export("dbPassword", db_password)
pulumi.export("dbUser", db_user)
```

### Putting It Together

When running the `pulumi up` command on a python stack, Pulumi will attempt to find and execute the entrypoint which is the `__main__.py` file. Hence that's where necessary procedures of resource allocation should start.

We could also leverage the fact that python executes code on import modules and just import the necessary resources we want to provision.

```python
# source: pulumi/global/__main__.py
from network import *
from rds import *
from route53 import FailoverRecordTypeEnum, create_r53_record
import pulumi

def use_route53(nlb_id: str, failover_type: FailoverRecordTypeEnum):
    if nlb_id:
        create_r53_record(nlb_id, failover_type)

sin_stk = pulumi.StackReference(pulumi.Config().require("sinStack"))
sin_stk.get_output("nlb.id").apply(
    lambda x: use_route53(x, FailoverRecordTypeEnum.PRIMARY)
)

hkg_stk = pulumi.StackReference(pulumi.Config().require("hkgStack"))
hkg_stk.get_output("nlb.id").apply(
    lambda x: use_route53(x, FailoverRecordTypeEnum.SECONDARY)
)
```

### Referencing External Stacks

Following the [Micro-Stack](https://www.pulumi.com/docs/using-pulumi/organizing-projects-stacks/#micro-stacks) project structure, we have 2 stacks that requires references from the other, which could easily be resolved either by using an external configuration file as a reference or just simply using the Pulumi [Output](https://www.pulumi.com/docs/concepts/inputs-outputs/#outputs) + [StackReference](https://www.pulumi.com/learn/building-with-pulumi/stack-references/).

```python
# source: https://www.pulumi.com/learn/building-with-pulumi/stack-references
import pulumi

config = pulumi.Config()
stack = pulumi.get_stack()
org = config.require("org")

stack_ref = pulumi.StackReference(f"{org}/my-first-app/{stack}")

pulumi.export("shopUrl", stack_ref.get_output("url"))
```

In essence, this would allow the `regional` stack to get the output reference of `global` such as the VPC id to provision new resources to. An example of the implementation:

```python
# source: pulumi/regional/network/__init__.py
import pulumi_aws as aws
import pulumi

config = pulumi.Config("aws")
region = config.require("region")
global_stk = pulumi.StackReference(pulumi.Config().require("globalStack"))

vpc_id: str = global_stk.require_output(f"{region}:vpcId")
sg_id: str = global_stk.require_output(f"{region}:sgId")
public_subnet_az_a_id: str = global_stk.require_output(f"{region}:publicSubnetAzAId")  
public_subnet_az_b_id: str = global_stk.require_output(f"{region}:publicSubnetAzBId")
private_subnet_az_a_id: str = global_stk.require_output(f"{region}:privateSubnetAzAId")
private_subnet_az_b_id: str = global_stk.require_output(f"{region}:privateSubnetAzBId")

vpc = aws.ec2.Vpc.get(f"main-{region.replace('-', '_')}", id=vpc_id)
sg = aws.ec2.SecurityGroup.get(f"ecs-security-group_{region}", id=sg_id)
public_subnet_az_a = aws.ec2.Subnet.get(
    f"subnet-{region.replace('-', '_')}a-public",
    id=public_subnet_az_a_id,
)
private_subnet_az_a = aws.ec2.Subnet.get(
    f"subnet-{region.replace('-', '_')}a-private",
    id=private_subnet_az_a_id,
)
public_subnet_az_b = aws.ec2.Subnet.get(
    f"subnet-{region.replace('-', '_')}b-public",
    id=public_subnet_az_b_id,
)
private_subnet_az_b = aws.ec2.Subnet.get(
    f"subnet-{region.replace('-', '_')}b-private",
    id=private_subnet_az_b_id,
)

pulumi.export("aws:region", region)
```

### AWS Specific Details

Once we fully understood the core functionalities that Pulumi provides, what's left is to understand the best practices for provisioning AWS resources, with or without IaC tools.

Resources:

- [Security best practices for your VPC - Amazon Virtual Private Cloud](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html)
- [Best practices - Amazon EC2 - Amazon Elastic Compute Cloud](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-best-practices.html)
- [Best practices - Amazon ECS - Amazon Elastic Container Service](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/application.html)
- [Best practices - Networking - Amazon Elastic Container Service](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/networking.html)
- [Best practices - AWS Lambda - AWS Lambda Functions](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Best practices - Amazon RDS - Amazon Relational Database Service](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

## Challenges

Using Pulumi has mostly been pleasant, but it's not without some hiccups once every so often.

### Documentation

> Disclaimer: Pulumi's documentation in general is great - a lot better than many open-sourced tooling on the internet. However, from the eye of the novice, somethings are not as well described as I would hope for it to be.

I found that referencing Terraform's documentation, coupled with AWS resource-specific guide, to be the best combination when working with new AWS resources to be provisioned through Pulumi.

### Lack of References

Considering that Pulumi is a relatively young tool, researching for best practices to replicate was challenging due to the limited availability of resources and references compared to more established tools like [Terraform](https://www.terraform.io/) or [CloudFormation](https://aws.amazon.com/cloudformation/). When faced with issues foreign to me, it took me quite a while to search on places like stackoverflow or public GitHub repositories before finally finding solutions that are written for Terraform but yet still works in Pulumi (ironically this is another great thing about Pulumi since it uses the same APIs as Terraform does for infrastructure provisioning on cloud providers like AWS). Don't even think about using Pulumi AI, using it has caused me more problems than if I were to just do a more in-depth research on the resource or just look at the Pulumi source code.

Pulumi has a relatively active [slack channel](https://slack.pulumi.com/) where questions can be quickly answered but for a beginner, most of the time, the challenge lies in [forming a good question](https://stackoverflow.com/help/how-to-ask), which coupled with lack of necessary context, can be quite time-consuming.

## vs Terraform

The main reason why Terraform is used here as a comparison is because it has a lot of great features that are attractive to many: open-source, extensive documentation, and supports most major cloud providers and lower-level infrastructure system like Kubernetes.

However, Terraform isn't without its challenges. The primary drawback lies in needing to learn and master the [HashiCorp Configuration Language (HCL)](https://github.com/hashicorp/hcl) in order to write resource configurations. While suitable for basic tasks, it becomes difficult to modularize code and articulate complex logical constructs such as `if` statements and `for` loops, particularly within expansive projects.

The Pulumi team has done a great job listing key areas of comparison between Pulumi and Terraform in [their comparison documentation](https://www.pulumi.com/docs/concepts/vs/terraform/#differences) and at risk of repetition, I'll be listing a few areas which impacted our ability get things out quick.

### Popularity

Given that Terraform has been around for much longer, it definitely has a much larger community around it compared to Pulumi but I would say Pulumi's community is growing fast and there are also much more activity on [Pulumi's GitHub repository](https://github.com/pulumi/pulumi/pulse/monthly) than [Terraform's](https://github.com/hashicorp/terraform/pulse/monthly) but Pulumi has about half the number of stargazers than Terraform.

This popularity affected the number of issues identified and shared among the community, which in turn directly impacted the availability of online resources that we could reference.

### Concepts

Pulumi, similar to Terraform, support importing existing resources so that they can be managed. However, on top of that, Pulumi allows generation of code from an existing state but Terraform requires it to be manually written.

Pulumi also allows the conversion of templates by Terraform HCL, Kubernetes YAML, and Azure ARM into Pulumi programs, which is incredibly useful for teams that are already deep into the other IaC tools and want to convert to Pulumi.

### Programming Language

Pulumi, in contrast to Terraform, enables users to leverage familiar general-purpose programming through their SDKs which [supports multiple languages on different runtimes](https://www.pulumi.com/docs/languages-sdks/) such as Python, Node.js (JavaScript, TypeScript), .NET (C#, F#, VB), Java, and even on YAML for configuration. This enables seamless integration with the user's preferred IDE and allows users to leverage familiar code modularization designs and logical primitives directly through their preferred language and environment.

## Final Thoughts

It's worth a try.
