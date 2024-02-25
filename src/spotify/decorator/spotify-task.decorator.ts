import { v4 as uuidv4 } from 'uuid';
import { Injectable, OnModuleInit, SetMetadata, applyDecorators } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

export const SPOTIFY_TASK_FLAG = Symbol('SPOTIFY_TASK_FLAG');

export const SpotifyTask = (): MethodDecorator => {
  return applyDecorators(SetMetadata(SPOTIFY_TASK_FLAG, true));
};

@Injectable()
export class SpotifyTaskRegister implements OnModuleInit {
  private readonly spotifyTaskQueue: string[] = [];
  private spotifyTaskLock = false;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  private wrap(instance: { [methodName: string]: (...args: unknown[]) => unknown }, methodName: string) {
    const method = instance[methodName];

    instance[methodName] = async (...args: unknown[]) => {
      const taskId = uuidv4();
      this.spotifyTaskQueue.push(taskId);
      while (this.spotifyTaskLock || this.spotifyTaskQueue[0] !== taskId) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      this.spotifyTaskLock = true;
      this.spotifyTaskQueue.shift();
      try {
        const originalMethodResult = await method.call(instance, ...args);
        this.spotifyTaskLock = false;
        return originalMethodResult;
      } catch (error) {
        this.spotifyTaskLock = false;
        throw error;
      }
    };
  }

  public onModuleInit() {
    const providers = this.discoveryService.getProviders();
    providers.forEach(({ instance }) => {
      if (instance == null) {
        return;
      }
      const methodNames = this.metadataScanner.getAllMethodNames(instance);
      methodNames.forEach((methodName) => {
        const spotifyTaskFlag = this.reflector.get<boolean>(SPOTIFY_TASK_FLAG, instance[methodName]);
        if (spotifyTaskFlag) {
          const metadatas = Reflect.getOwnMetadataKeys(instance[methodName]).map((metadataKey) => ({
            key: metadataKey,
            value: Reflect.getMetadata(metadataKey, instance[methodName]),
          }));
          this.wrap(instance, methodName);
          metadatas.forEach((metadata) => Reflect.defineMetadata(metadata.key, metadata.value, instance[methodName]));
        }
      });
    });
  }
}
