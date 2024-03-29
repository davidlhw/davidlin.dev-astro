---
external: false
title: "Crontab Notorious Gotcha with `%`"
description: A common issue encountered when using the crontab command in Unix-like operating systems involving the unescaped `%` character. Which is used to denote a newline character, unless escaped with a backslash (`\`).
# ogImagePath:
date: 2023-09-12
featured: true
---

In the following crontab, add a simple job to log the top 20 processes by memory usage every hour. The job uses the `top` command to list processes sorted by memory usage and pipes the output to `head` to get the top 20 processes. The output is then appended to a file `top.log`. The `2>&1` redirects both standard output and standard error to the file.

```sh title="crontab"
# Cron job to log top 20 processes by memory usage
0 * * * * /usr/bin/top -bc -o +%MEM -w512 | head -n 20 >> ~/top.log 2>&1
```

We expect to see the top 20 processes by memory usage logged to `top.log` every hour like so:

```log title="top.log"
top - 03:23:00 up 10 days, 19:13,  0 users,  load average: 0.01, 0.03, 0.00
Tasks:  16 total,   1 running,  15 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :  15967.1 total,  11344.5 free,   1771.7 used,   2850.9 buff/cache
MiB Swap:   4096.0 total,   4096.0 free,      0.0 used.  13791.1 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
  143 user      20   0  769360  46304  26688 S   0.0   0.3   0:34.34 some-command
  126 root      20   0 1249344  25724  15280 S   0.0   0.2   0:11.14 some-command
 1709 user      20   0   10064   4964   3252 S   0.0   0.0   0:00.04 some-command
 1723 user      20   0   10732   3756   3296 R   0.0   0.0   0:00.00 some-command
 1657 root      20   0    8544   2152   1936 S   0.0   0.0   0:00.00 some-command
    1 root      20   0    2456   1616   1496 S   0.0   0.0   0:00.00 some-command
  115 root      20   0    2468    828    696 S   0.0   0.0   0:00.00 some-command
  117 user      20   0    2616    528    460 S   0.0   0.0   0:00.00 some-command
 1724 user      20   0    7252    524    452 S   0.0   0.0   0:00.00 some-command
    6 root      20   0    2504    196    196 S   0.0   0.0   0:00.04 some-command
  125 root      20   0    2484    132      0 S   0.0   0.0   0:00.00 some-command
  142 root      20   0    2484    132      0 S   0.0   0.0   0:00.00 some-command
  116 root      20   0    2480    128      0 S   0.0   0.0   0:00.00 some-command
```

However, the job does not run as expected. We don't see the file `top.log` and it indicates that the cron is not working since just running the command on the terminal shows the output as expected.

```sh title="shell"
$ /usr/bin/top -bc -o +%MEM -w512 | head -n 20

top - 03:23:00 up 10 days, 19:13,  0 users,  load average: 0.01, 0.03, 0.00
Tasks:  16 total,   1 running,  15 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :  15967.1 total,  11344.5 free,   1771.7 used,   2850.9 buff/cache
MiB Swap:   4096.0 total,   4096.0 free,      0.0 used.  13791.1 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
  143 user      20   0  769360  46304  26688 S   0.0   0.3   0:34.34 some-command
  126 root      20   0 1249344  25724  15280 S   0.0   0.2   0:11.14 some-command
 1709 user      20   0   10064   4964   3252 S   0.0   0.0   0:00.04 some-command
 1723 user      20   0   10732   3756   3296 R   0.0   0.0   0:00.00 some-command
 1657 root      20   0    8544   2152   1936 S   0.0   0.0   0:00.00 some-command
    1 root      20   0    2456   1616   1496 S   0.0   0.0   0:00.00 some-command
  115 root      20   0    2468    828    696 S   0.0   0.0   0:00.00 some-command
  117 user      20   0    2616    528    460 S   0.0   0.0   0:00.00 some-command
 1724 user      20   0    7252    524    452 S   0.0   0.0   0:00.00 some-command
    6 root      20   0    2504    196    196 S   0.0   0.0   0:00.04 some-command
  125 root      20   0    2484    132      0 S   0.0   0.0   0:00.00 some-command
  142 root      20   0    2484    132      0 S   0.0   0.0   0:00.00 some-command
  116 root      20   0    2480    128      0 S   0.0   0.0   0:00.00 some-command
```

The issue is with the `%` character in the command. The `%` character is a special character in Cron and must be escaped with a backslash (`\`) to be treated as a literal `%`.

From this [StackOverflow answer](https://stackoverflow.com/a/27125439):

> % is a special character for crontab. From man 5 crontab:
>
> The "sixth" field (the rest of the line) specifies the command to be run. The entire command portion of the line, up to a newline or a `%` character, will be executed by /bin/sh or by the shell specified in the SHELL variable of the cronfile. A `%` character in the command, unless escaped with a backslash (`\`), will be changed into newline characters, and all data after the first `%` will be sent to the command as standard input.
>
> So you need to escape the `%` character.

After adding the backslash to escape the `%` character, the crontab works as expected.

```diff title="crontab"
-0 * * * * /usr/bin/top -bc -o +%MEM -w512 | head -n 20 >> ~/top.log 2>&1
+0 * * * * /usr/bin/top -bc -o +\%MEM -w512 | head -n 20 >> ~/top.log 2>&1
```
