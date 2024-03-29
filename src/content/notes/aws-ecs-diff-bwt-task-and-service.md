---
external: false
title: "AWS ECS: Difference between a task and a service"
description: It appears that one can either run a Task or a Service based on a Task Definition. What are the differences and similarities between Task and Service? Is there a clue in the fact that one can specify "Task Group" when creating Task but not Service? Are Task and Service hierarchically equal instantiations of Task Definition, or is Service composed of Tasks?
# ogImagePath:
date: 2023-09-11
featured: true
---

It appears that one can either run a Task or a Service based on a Task Definition. What are the differences and similarities between Task and Service? Is there a clue in the fact that one can specify "Task Group" when creating Task but not Service? Are Task and Service hierarchically equal instantiations of Task Definition, or is Service composed of Tasks?

```yaml
# service.yaml
taskDefinition:
  family: my-task
  startupTimeout: 60
  taskRoleArn: arn:aws:iam::123456789012:role/my-task-role
  containerDefinitions:
    - name: my-container
      image: my-image
      cpu: 256
      memory: 512
      portMappings:
        - containerPort: 80
          protocol: tcp
      environment:
        - name: ENV_VAR
          value: "value"
      essential: true
      logConfiguration:
        logDriver: awslogs
        options:
          awslogs-group: my-log-group
          awslogs-region: us-west-2
          awslogs-stream-prefix: my-container
```

A Task Definition is a collection of 1 or more container configurations. Some Tasks may need only one container, while other Tasks may need 2 or more potentially linked containers running concurrently. The Task definition allows you to specify which Docker image to use, which ports to expose, how much CPU and memory to allot, how to collect logs, and define environment variables.

A Task is created when you run a Task directly, which launches container(s) (defined in the task definition) until they are stopped or exit on their own, at which point they are not replaced automatically. Running Tasks directly is ideal for short-running jobs, perhaps as an example of things that were accomplished via CRON.

A Service is used to guarantee that you always have some number of Tasks running at all times. If a Task's container exits due to an error, or the underlying EC2 instance fails and is replaced, the ECS Service will replace the failed Task. This is why we create Clusters so that the Service has plenty of resources in terms of CPU, Memory and Network ports to use. To us it doesn't really matter which instance Tasks run on so long as they run. A Service configuration references a Task definition. A Service is responsible for creating Tasks.

Services are typically used for long-running applications like web servers. For example, if I deployed my website powered by Node.JS in Oregon (us-west-2) I would want say at least three Tasks running across the three Availability Zones (AZ) for the sake of High-Availability; if one fails I have another two and the failed one will be replaced (read that as self-healing!). Creating a Service is the way to do this. If I had 6 EC2 instances in my cluster, 2 per AZ, the Service will automatically balance Tasks across zones as best it can while also considering CPU, memory, and network resources.

Another very important point is that a Service can be configured to use a load balancer, so that as it creates the Tasks—that is it launches containers defined in the Task Definition—the Service will automatically register the container's EC2 instance with the load balancer. Tasks cannot be configured to use a load balancer, only Services can.
