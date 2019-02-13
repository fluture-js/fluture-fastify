# Fluture Fastify
[![Build Status](https://travis-ci.com/wearereasonablepeople/fluture-fastify.svg?branch=master)](https://travis-ci.com/wearereasonablepeople/fluture-fastify)

Create [Fastify][] handlers using [Future][]s from [Fluture][].

## Usage

```console
npm install --save fluture fluture-fastify
```

Allows using pure functions as Fastify handlers.
Expects actions to return Futures and the reply
to be decorated with a property `locals`
that will be passed to every action as its second argument.

```javascript
import {handler, Typed} from 'fluture-fastify';
import {after} from 'fluture';
import createApp from 'fastify';

const app = createApp({logger: true});

const Json = Typed ('application/json; charset=utf-8');
const action = (req, {number}) => after (100, Json (200, number));

app.decorateReply ('locals', {number: 42});
app.get ('/number', handler ('getNumber', action));

app.listen (3000, '0.0.0.0');
```

## API

### Responses

### <a name="Typed" href="https://github.com/wearereasonablepeople/fluture-fastify/blob/master/index.mjs#L42">`Typed :: (Str, Num, Any) -⁠> Response a`</a>

A typed response requires status code, some content and the
content type. The type defines how the value is serialized.
In order to see all the possible combinations see [reply.send][] docs.

#### Plain text
```javascript
const Plain = Typed ('text/plain; charset=utf-8');

Plain (200, 'Number 42');
```
#### Json

```javascript
const Json = Typed ('application/json; charset=utf-8');

Json (200, {number: 42});
```
#### Stream

```javascript
const Stream = Typed ('application/octet-stream');

Stream (200, createReadStream ('file', 'utf8'));
```
### <a name="Serialized" href="https://github.com/wearereasonablepeople/fluture-fastify/blob/master/index.mjs#L68">`Serialized :: (b -⁠> c, Str, Num, b) -⁠> Response a`</a>

A typed response with a custom serializer.

```javascript
const Proto = Serialized (protoBuf.serialize, 'application/x-protobuf');

Proto (200, new protoBuf ());
```
### <a name="Redirect" href="https://github.com/wearereasonablepeople/fluture-fastify/blob/master/index.mjs#L77">`Redirect :: (Num, Str) -⁠> Response a`</a>

A redirection consisting of a URL and the status code.

### <a name="Empty" href="https://github.com/wearereasonablepeople/fluture-fastify/blob/master/index.mjs#L81">`Empty :: Response a`</a>

An empty response with status code 204.

### <a name="NotFound" href="https://github.com/wearereasonablepeople/fluture-fastify/blob/master/index.mjs#L85">`NotFound :: Response a`</a>

The default NotFound response.

### Functions

### <a name="handler" href="https://github.com/wearereasonablepeople/fluture-fastify/blob/master/index.mjs#L134">`handler :: (Str, (Req, a) -⁠> Future b (Response a)) -⁠> (Req, Res a) -⁠> undefined`</a>

Creates a Fastify handler from a named action. The action needs to either
resolve to a Response or reject with anything.
The rejected value will be send as a response with status code 500. The
status code can be overwritten by rejecting with an Error that contains
the prop `statusCode`.

[Fluture]: https://github.com/fluture-js/Fluture
[Future]: https://github.com/fluture-js/Fluture#future
[Fastify]: https://github.com/fastify/Fastify
[reply.send]: https://github.com/fastify/fastify/blob/master/docs/Reply.md#senddata
