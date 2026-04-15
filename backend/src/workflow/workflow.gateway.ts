import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class WorkflowGateway {
  @WebSocketServer()
  server!: Server;

  emitWorkflowUpdate(workflowId: string, data: Record<string, unknown>): void {
    this.server?.emit('workflow:update', { workflowId, ...data });
  }

  emitStepUpdate(
    workflowId: string,
    stepIndex: number,
    data: Record<string, unknown>,
  ): void {
    this.server?.emit('step:update', { workflowId, stepIndex, ...data });
  }

  @SubscribeMessage('workflow:subscribe')
  handleSubscribe(client: Socket, workflowId: string): void {
    client.join(`workflow:${workflowId}`);
  }
}
