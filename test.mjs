import {resolve, reject} from 'fluture';
import S from 'sinon';
import {
  deepStrictEqual as eq,
  throws,
} from 'assert';

import {
  Typed,
  Empty,
  NotFound,
  Redirect,
  Serialized,
  handler,
} from '.';

function mock() {
  return {
    code: S.stub ().returnsThis (),
    type: S.stub ().returnsThis (),
    send: S.stub ().returnsThis (),
    serializer: S.stub ().returnsThis (),
  };
}

const K = x => _ => x;
const req = {};

throws (
  _ => handler ('noresponse', K (resolve (null))) (req, {}),
  new TypeError (
    'The Future returned by "noresponse" did not resolve to a Response, '
    + 'instead saw:\n\nnull\n'
  )
);

throws (
  _ => handler ('nofuture', K (null)) (req, {}),
  new TypeError (
    'The action "nofuture" did not return a Future, instead saw:\n\nnull\n'
  )
);

{
  const serializer = K (null);
  const action = K (resolve (
    Serialized (serializer, 'application/null', 200, 'Something')
  ));
  const reply = mock ();

  handler ('serialized', action) (req, reply);

  eq (reply.serializer.calledOnceWithExactly (serializer), true);
  eq (reply.type.calledOnceWithExactly ('application/null'), true);
  eq (reply.code.calledOnceWithExactly (200), true);
  eq (reply.send.calledOnceWithExactly ('Something'), true);
}
{
  const action = K (resolve (Typed ('application/json', 200, null)));
  const reply = mock ();

  handler ('json', action) (req, reply);

  eq (reply.type.calledOnceWithExactly ('application/json'), true);
  eq (reply.code.calledOnceWithExactly (200), true);
  eq (reply.send.calledOnceWithExactly (null), true);
}
{
  const action = K (resolve (Empty));
  const reply = mock ();

  handler ('empty', action) (req, reply);

  eq (reply.code.calledOnceWithExactly (204), true);
  eq (reply.send.calledOnceWithExactly (null), true);
}
{
  const action = K (resolve (NotFound));
  const reply = {callNotFound: S.spy ()};

  handler ('notfound', action) (req, reply);

  eq (reply.callNotFound.calledOnce, true);
}
{
  const action = K (resolve (Redirect (418, 'imateapot')));
  const reply = {redirect: S.spy ()};

  handler ('notfound', action) (req, reply);

  eq (reply.redirect.calledOnceWithExactly (418, 'imateapot'), true);
}
{
  const error = new Error ('imanerror');
  const action = K (reject (error));
  const reply = mock ();

  handler ('error', action) (req, reply);

  eq (reply.code.calledOnceWithExactly (500), true);
  eq (reply.send.calledOnceWithExactly (error), true);
}
