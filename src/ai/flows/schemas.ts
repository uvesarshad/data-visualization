import { z } from 'zod';

export const ColumnMetadataSchema = z.object({
  name: z.string().describe('The name of the column.'),
  dataType: z.enum(['string', 'number', 'boolean', 'date']).describe('The data type of the column.'),
  isCategorical: z.boolean().describe('True if the column contains categorical data.'),
  isNumerical: z.boolean().describe('True if the column contains numerical data.'),
  isTemporal: z.boolean().describe('True if the column contains temporal (date/time) data.'),
  uniqueValuesCount: z.number().optional().describe('The number of unique values in the column.'),
  min: z.number().optional().describe('The minimum value in the column.'),
  max: z.number().optional().describe('The maximum value in the column.'),
  avg: z.number().optional().describe('The average value in the column.'),
  exampleValues: z.array(z.string()).optional().describe('A few example values from the column.'),
});