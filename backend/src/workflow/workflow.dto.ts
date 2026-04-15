import { IsString, IsArray, IsOptional, MinLength, ArrayMinSize } from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[];

  @IsOptional()
  @IsString()
  template?: string;
}

export class UpdateWorkflowDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  steps!: string[];
}
