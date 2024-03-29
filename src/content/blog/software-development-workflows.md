---
external: false
title: Software Development Workflows
description: Creating and releasing software places a premium on speed and agility in the current software development context. To make several concurrent modifications, teams need to prioritize having an effective branching technique.
# ogImagePath:
date: 2022-07-26
featured: true
---

Creating and releasing software places a premium on speed and agility in the current software development
context. To make several concurrent modifications, teams need to prioritize having an effective branching
technique.

## What is a branching technique?

Development teams typically utilize branches as a way to build features. It simply consists of a set of
guidelines that programmers can adhere to when deciding how to collaborate with a common codebase.

Adhering to such techniques further enhances the DevOps process as the DevOps itself is about developing a quick
workflow that enables the delivery of small
batches of code. DevOps consists of a set of procedures called CI/CD that allow development teams to deploy code
updates regularly and fast.

Git branching techniques include:

### GitFlow

There are five main types of branches to this technique.

- **Master:** the main branch with stored production code for deployment
- **Develop:** possess ongoing development and all the finished codes of other branches
- **Feature:** used to develop new features
- **Hotfix:** fix issues and merged to Develop and Master
- **Release:** prepare to release candidate which will be merged to Develop and Master branches

The most well-known branching mechanism (also known as feature-based development) uses multiple branches to
handle the source code. Two key branches of this technique are Master and Develop.

Utilizing the development branch as a starting point, developers build various branches for various use cases.
The `Feature`, `Hotfix`, and `Release` branches are created as such.

### GitHub Flow

GitHub Flow is a more user-friendly replacement to GitFlow since smaller teams do not need to handle many
versions. This approach lacks `Release` branches, in contrast to GitFlow. Developers begin with the `Master`
branch, then separate their activity into `Feature` branches that come straight from the `Master`, which are
subsequently merged back into the `Master` for release.

The key concept underlying this approach is maintaining the master code in a continuously deployable state, which
can ease up CI/CD operations.

### GitLab Flow

The developers work straight with the `Master` branch in this approach. Few new environmental branches are added
according to the circumstance such as production and pre-production branches. Development takes place in one of
the environmental branches and confirmed and tested code is merged into other branches till it reaches the
production branch.

The `Feature` branch in the GitLab workflow houses work on new features and bug fixes that may be merged back
into the `Master` branch for release after they are pushed, reviewed and merged.

### Trunk-Based Development

The developers incorporate their changes directly into the `Master` branch (shared trunk) very frequently and
fast. No branches are utilized here. It has continuous small changes and prevents merge issues. Thus, Trunk-Based
Development is a strict CI/CD follower.

The deployment process uses feature flags in the shared trunk to filter any incomplete code and allow only
complete code for public release.

The following is a table highlighting the pros and cons of the Git branching techniques.

## What is the most preferred branching technique?

All the branching techniques discussed are proven methods to manage source code. The ideal choice of approach
does not exist. It is heavily dependent on the needs of the team as well as the nature and the complexity of the
project. To get started quicklys with a small team, the Trunk-Based Development and GitHub Flow approaches are
generally ideal to maintain a single release version.

The following is a summarized table for what I think is the most suitable pick based on the software product and
the expected deployment cycle.

[Best Git Branching Strategies](https://bit.ly/3P0DEeH) goes much more in-depth into the understanding of
techniques and their selection process.

## Branching techniques used in FAANG companies

[Meta (Facebook)](https://engineering.fb.com/2017/08/31/web/rapid-release-at-massive-scale/) engineering states
that they empower programmers to distribute their code in modest, safe, progressive increments and do it rapidly
and accurately.
Teams at [Google](https://cloud.google.com/architecture/devops/devops-tech-trunk-based-development) emphasize
much on DevOps and CI/CD and adhere to the disciplinary Trunk-Based Development approach.

According to a senior software engineer at [Amazon](https://www.infoq.com/news/2020/07/continuous-delivery-amazon/),
they rarely produce branches for coding and deal straight with the main branch and hence employ TBD. It also is
essentially a CI/CD requirement.

In general, GitFlow and TBD are two prominent [Git-based workflows](https://circleci.com/blog/trunk-vs-feature-based-dev)
that modern tech companies employ in their development.

## Recap

Developers need to break down the software development into many branches for various reasons and thus branching
techniques are used.

Practicing branching techniques improves DevOps and software development in every sense. Git branching is one
such popular method. Several of its techniques have their use cases depending on the software product type and
requirements.
