---
external: false
title: Pass-by-Ref vs Pass-by-Val
description: Arguably a fundamental and critical topic to understand in programming.
# ogImagePath:
date: 2023-07-21
featured: true
---

I’ll be covering:

- How memory & functions work
- Difference between value & reference
- Code & examples
- Why this is important
- What knowing this enable you to do

## How memory works

To understand pass-by-value and pass-by-reference, it’s important to understand a little bit about how memory
works, at least roughly.

Memory is a large array of slots, each of which can hold a single byte of data (a single byte = 8 bits). Why 8
bits? A byte (or 8 bits) is usually the [smallest unit of addressable memory in many computer architectures](https://en.wikipedia.org/wiki/Byte#:~:text=The%20byte%20is%20a%20unit,memory%20in%20many%20computer%20architectures.).

![Memory](/images/blog/pass-by-ref-pass-by-val/memory-address.png)

Going back to the array, each slot has an address; in other words, given an address, you can look up the
specific byte in memory.

When you allocate a new variable, what you are really doing is reserving a space in memory somewhere to store
your variable; and to refer back to that memory, you have the address.

Different types of data requires more than a single byte, obviously. Hence, when you allocate something, you
may reserve a whole chunk of memory and of course, the address will simply be the start of it.

For example, a number in JavaScript is a double precision float (8 bytes), so allocating a number in
JavaScript will require 64 bits (8 bits per byte \* 8 bytes) to be reserved.

![Number](/images/blog/pass-by-ref-pass-by-val/number-space.png)

Depending on the type, more or less memory may be involved. If you allocate a string (in JavaScript, every
character in a string is represented by a 16 bit number, or 2 bytes) in JavaScript, the amount of memory
needed is directly related to how many characters there are in the string. In other words, the longer the
string, the more memory it uses. Very intuitive.

So how does this have to do with Value vs Reference? Let’s move on by looking at how calling a function works.

## Function Calls

```jsx
function changeValue(x) {
  x = 20;
}

let x = 10;
changeValue(x);
console.log(x); // 10
```

Say I have this function called `changeValue` and it takes a parameter, x, and does some change to the value.

It doesn’t matter what this function does but what we’re going to do is look at how it actually works
underneath. In other words, in terms of what the computer and memory is doing.

When do you a function call, there’s just a few key concepts to take away. In this particular function, we run
a few lines of code before actually calling the function `changeValue`, specifically in line 1-3 where we
defined the function `changeValue` and line 4 where we assigned x to the value of 10 then, the `changeValue`
function is called at line 5.

What happens when you call a function is that all the arguments used by this function call would be packaged
somewhere (it could be in memory or registers but it doesn’t matter for the purposes of this discussion). Then
you move execution of the code to the function, the function unpacks the arguments, the code in the function
executes, and it may be that you eventually return (not guaranteed due to potential runtime errors) from the
function and continue from where you left off.

![function](/images/blog/pass-by-ref-pass-by-val/function.png)

Here is where pass-by-value vs pass-by-reference matters. There’s [2 common strategies](https://en.wikipedia.org/wiki/Evaluation_strategy#:~:text=Year%20first%20introduced-,Call%20by%20reference,1960,-Call%20by%20name) for packaging up all those arguments for the function.

How does this work in JavaScript? How do I choose which one to use?

In languages like C++, you explicitly choose which depending on your needs, so it’s not unusual to browse C++
code that mixes pass-by-value and pass-by-reference. In JavaScript, you don’t need to decide as it is chosen
for you.

> Arguments are always *[passed by value](https://en.wikipedia.org/wiki/Evaluation_strategy#Call_by_reference) > * and never *passed by reference*. This means that if a function reassigns a parameter, the value won't
> change outside the function. More precisely, object arguments are *[passed by sharing](https://en.wikipedia.org/wiki/Evaluation_strategy#Call_by_sharing)*
> , which means if the object's properties are mutated, the change will impact the outside of the function.
>
> - [Functions - JavaScript | MDN (mozilla.org)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions#passing_arguments)

What this essentially means is that primitive data types are always passed by value in JavaScript while a
non-primative data type objects (i.e an array or a user-defined object) is passed by sharing (a copy of the
object reference — address in memory).

## Pass-by-Value in JavaScript

In pass-by-value, the value of the argument is copied into the function's local variable, that is packaged and
used by the function. This means that any changes made to the local variable will not affect the original
argument.

For example, the following code will print the value 10, even though the value of `x` is changed inside the
function:

```jsx
function changeValue(x) {
  x = 20;
}

let x = 10;
changeValue(x);
console.log(x); // 10
```

## Pass-by-Reference in JavaScript

In pass-by-reference, the reference to the argument (ie memory address) is passed to the function. This means
that any changes made to the argument inside the function will also affect the original argument as both those
values is referred from the same memory address.

For example, the following code will print the value 20, even though the value of `x` is changed inside the
function:

```jsx
function changeValue(x) {
  x.value = 20;
}

let x = { value: 10 };
changeValue(x);
console.log(x.value); // 20
```

## Why is this important?

There are a few reasons:.

1. **It helps you write better code.** understanding your code thoroughly, not just on a superficial level,
   will help you build applications where the behaviour of the code is clear, consistent, and can be easily
   reasoned about. This can help you write code that is more efficient, bug-free, and easier to understand.
2. **It helps you build a better mental model of how programming languages work.** Understanding the concepts
   of pass-by-value and pass-by-reference can help you understand how programming languages work at a deeper
   level, which will help in building understanding for more complex ideas like data structures.
3. **It helps you understand other programming languages.** The concept of pass-by-value vs pass-by-reference
   is something fundamental to many programming languages. Learning what’s happening, even if it’s only
   roughly what’s under hood, will help you quickly and easily understand what happening when you need to
   switch between languages.

## What now?

Now that you understand the basics of pass-by-value and pass-by-reference, you can start to apply this
knowledge to your own code. Here are a few things you can do:

- **Experiment with different pass-by-value and pass-by-reference patterns.** See how they affect the behavior
  of your code.
- **Read the documentation for your programming language** to learn more about how pass-by-value and
  pass-by-reference work**.**
- **Ask questions on online forums or in programming communities.** There are many people who are willing to
  help you learn more about these concepts.

With a little practice, you will be able to use pass-by-value and pass-by-reference to write better code.
