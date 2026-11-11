import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, registerNotFoundFallback } from './app.setup';
import { loadLocalEnvFile, parseEnv } from './config/env';

async function bootstrap(): Promise<void> {
  loadLocalEnvFile();
  const env = parseEnv(process.env);
  const app = configureApp(await NestFactory.create(AppModule), env);
  await app.init();
  registerNotFoundFallback(app);
  await app.listen(env.PORT, '0.0.0.0');
}

void bootstrap();
