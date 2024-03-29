---
external: false
title: F# Phantom Typing
description: The idea is that you will have a generic wrapper `Event<'T>` and use different types for `'T` to represent different types of Events. These types (referring to `'T`) are never actually instantiated, which is why they're called phantom types.
# ogImagePath:
date: 2023-07-24
featured: true
---

The idea is that you will have a generic wrapper `Event<'T>` and use different types for `'T` to represent different types of Events. These types (referring to `'T`) are never actually instantiated, which is why they're called phantom types.

```fs
# phantom-typing.fs
[<Struct>]
type Event<'T> = Event of string

type ClickEvent = interface end
type KeyEvent = interface end

// Now we can create events of different types using the phantom types:
let createClickEvent (data: string) : Event<ClickEvent> = Event(data)
let createKeyEvent (data: string) : Event<KeyEvent> = Event(data)

// The nice thing about this is that we can write functions that work
// with any event easily:
let logEvent (Event data) = printfn "Event data: %s" data

// For example, I can now create one click event, one key event, and
// log both:
let clickEvent = createClickEvent "Click on button"
let keyEvent = createKeyEvent "Press 'Enter' key"

logEvent clickEvent
logEvent keyEvent

// However, trying to mix or compare events of different types will
// result in a compile-time error:

// This line will not compile because clickEvent and keyEvent have
// different phantom types.
let result = clickEvent = keyEvent
```
