declare namespace Cloudflare {
  interface Env {
    ROOM: DurableObjectNamespace<import('./src/room').Room>;
    ALLOWED_ORIGINS: string;
  }

  interface GlobalProps {
    mainModule: typeof import('./src/index');
    durableNamespaces: 'Room';
  }
}

type Env = Cloudflare.Env;
