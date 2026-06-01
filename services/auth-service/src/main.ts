import { NestFactory } from '@nestjs/core';
// Transport — enum of available transport protocols (TCP, Redis, RabbitMQ etc)
// MicroserviceOptions — TypeScript type that describes the config object shape
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // createMicroservice instead of create —
  // creates a TCP server instead of an HTTP server.
  // the frontend and browsers cant talk to this directly,
  // only other NestJS services that know the TCP protocol can.
  //
  // <MicroserviceOptions> is a TypeScript generic —
  // it tells TypeScript what shape the config object should be,
  // so you get autocomplete and type checking on the options below.
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      // TCP — raw TCP protocol, simpler and faster than HTTP.
      // designed for internal service-to-service communication inside Docker.
      // other options would be Transport.REDIS, Transport.RMQ (RabbitMQ) etc.
      transport: Transport.TCP,
      options: {
        // 0.0.0.0 means listen on ALL network interfaces.
        // inside Docker each container gets its own IP from Docker's network,
        // but that IP is assigned randomly and changes.
        // 0.0.0.0 means "i dont care which IP Docker gave me,
        // accept connections coming from any of them".
        // if you wrote 127.0.0.1 here, only processes inside this
        // exact container could connect — other containers couldn't reach it.
        host: '0.0.0.0',

        // the port this microservice listens on.
        // other services connect to this port to send messages here.
        // this port is internal to Docker — not exposed to the public internet
        // unless you explicitly add it to ports: in docker-compose.
        port: 3002,
      },
    },
  );

  // starts the microservice and begins listening for incoming TCP messages.
  // notice there is no port number here like app.listen(3000) in a normal HTTP app —
  // the port is already defined above in the transport options.
  await app.listen();
}

bootstrap().catch((err) => console.error('Error starting auth-service', err));
