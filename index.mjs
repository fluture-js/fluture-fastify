//. # Fluture Fastify
//. [![Build Status](https://travis-ci.com/fluture-js/fluture-fastify.svg?branch=master)](https://travis-ci.com/fluture-js/fluture-fastify)
//.
//. Create [Fastify][] handlers using [Future][]s from [Fluture][].

import Daggy from 'daggy';
import {isFuture} from 'fluture';
import curry from 'lodash.curry';
import {inspect} from 'util';

//. ## Usage
//.
//. ```console
//. npm install --save fluture fluture-fastify
//. ```
//.
//. Allows using pure functions as Fastify handlers.
//. Expects actions to return Futures and the reply
//. to be decorated with a property `locals`
//. that will be passed to every action as its second argument.
//.
//. ```javascript
//. import {handler, Typed} from 'fluture-fastify';
//. import {after} from 'fluture';
//. import createApp from 'fastify';
//.
//. const app = createApp({logger: true});
//.
//. const Json = Typed ('application/json; charset=utf-8');
//. const action = (req, {number}) => after (100, Json (200, number));
//.
//. app.decorateReply ('locals', {number: 42});
//. app.get ('/number', handler ('getNumber', action));
//.
//. app.listen (3000, '0.0.0.0');
//. ```
//.
//. ## API
//.
//. ### Responses
//.
//# Typed :: (Str, Num, Any) -> Response a
//.
//. A typed response requires status code, some content and the
//. content type. The type defines how the value is serialized.
//. In order to see all the possible combinations see [reply.send][] docs.
//.
//. #### Plain text
//. ```javascript
//. const Plain = Typed ('text/plain; charset=utf-8');
//.
//. Plain (200, 'Number 42');
//. ```
//. #### Json
//.
//. ```javascript
//. const Json = Typed ('application/json; charset=utf-8');
//.
//. Json (200, {number: 42});
//. ```
//. #### Stream
//.
//. ```javascript
//. const Stream = Typed ('application/octet-stream');
//.
//. Stream (200, createReadStream ('file', 'utf8'));
//. ```
//# Serialized :: (b -> c, Str, Num, b) -> Response a
//.
//. A typed response with a custom serializer.
//.
//. ```javascript
//. const Proto = Serialized (protoBuf.serialize, 'application/x-protobuf');
//.
//. Proto (200, new protoBuf ());
//. ```
//# Redirect :: (Num, Str) -> Response a
//.
//. A redirection consisting of a URL and the status code.
//.
//# Empty :: Response a
//.
//. An empty response with status code 204.
//.
//# NotFound :: Response a
//.
//. The default NotFound response.
const Response = Daggy.taggedSum ('Response', {
  Typed: ['type', 'code', 'value'],
  Serialized: ['serializer', 'type',  'code', 'value'],
  Redirect: ['code', 'url'],
  Empty: [],
  NotFound: [],
});

function run(name, action, request, reply) {
  const res = action (request, reply.locals);

  if (!isFuture (res)) {
    throw new TypeError (
      `The action "${name}" did not return a Future, instead saw:\n\n`
      + `${inspect (res)}\n`
    );
  }
  res.fork (
    err => {
      reply.code (500).send (err);
    },
    val => {
      if (!Response.is (val)) {
        throw new TypeError (
          `The Future returned by "${name}" did not resolve to a Response, `
          + `instead saw:\n\n${inspect (val)}\n`
        );
      }

      val.cata ({
        Typed: function(type, code, value) {
          reply.code (code).type (type).send (value);
        },
        Serialized: function(serializer, type, code, value) {
          reply.code (code).type (type).serializer (serializer).send (value);
        },
        Redirect: function(code, url) { reply.redirect (code, url); },
        Empty: function() { reply.code (204).send (null); },
        NotFound: function() { reply.callNotFound (); },
      });
    }
  );
}

//. ### Functions
//.
//# handler :: (Str, (Req, a) -> Future b (Response a)) -> (Req, Res a) -> undefined
//.
//. Creates a Fastify handler from a named action. The action needs to either
//. resolve to a Response or reject with anything.
//. The rejected value will be send as a response with status code 500. The
//. status code can be overwritten by rejecting with an Error that contains
//. the prop `statusCode`.
//.
export function handler(name, action) {
  return function(req, rep) {
    run (name, action, req, rep);
  };
}

export const Typed = curry (Response.Typed, 3);
export const Serialized = curry (Response.Serialized, 4);
export const Redirect = curry (Response.Redirect, 2);
export const Empty = Response.Empty;
export const NotFound = Response.NotFound;


//. [Fluture]: https://github.com/fluture-js/Fluture
//. [Future]: https://github.com/fluture-js/Fluture#future
//. [Fastify]: https://github.com/fastify/Fastify
//. [reply.send]: https://github.com/fastify/fastify/blob/master/docs/Reply.md#senddata
