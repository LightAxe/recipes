import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

// The 13 course slugs — single source mirrored from docs/taxonomy.md §1.
const COURSES = [
  'breakfast',
  'appetizer',
  'soup',
  'salad',
  'main',
  'side',
  'bread',
  'dessert',
  'cookies',
  'drink',
  'sauce',
  'canning',
  'other',
] as const;

// ISO-8601 *time* duration, e.g. PT30M, PT1H30M (docs/recipe-schema.md).
const duration = z
  .string()
  .regex(/^PT(?=\d)(\d+H)?(\d+M)?(\d+S)?$/, 'Use an ISO-8601 duration like PT30M or PT1H30M');

// lowercase-kebab-case (docs/taxonomy.md §3).
const kebab = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Tags must be lowercase-kebab-case');

const recipes = defineCollection({
  // Decoupled archive: read Markdown straight from the repo-root recipes/ dir
  // (ADR-0002 / architecture §4). Top-level *.md only, excluding the template;
  // `*.md` (not `**/*.md`) keeps us out of images/.
  loader: glob({ pattern: ['*.md', '!TEMPLATE.md'], base: './recipes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      contributor: z.string(),
      course: z.enum(COURSES),
      cuisine: z.string().optional(),
      tags: z.array(kebab).optional(),
      image: z.object({ src: image(), alt: z.string() }).optional(),
      servings: z.number().int().positive(),
      yield: z.string().optional(),
      prepTime: duration.optional(),
      cookTime: duration.optional(),
      totalTime: duration.optional(),
      ingredients: z
        .array(
          z.object({
            qty: z.number().positive().optional(),
            unit: z.string().optional(),
            item: z.string(),
            prep: z.string().optional(),
            note: z.string().optional(),
            grams: z.number().positive().optional(),
            gramsApprox: z.boolean().optional(),
            gramsSource: z.string().optional(),
            section: z.string().optional(),
          }),
        )
        .min(1),
      instructions: z
        .array(
          z.union([
            z.string(),
            z.object({
              text: z.string(),
              section: z.string().optional(),
              timer: duration.optional(),
            }),
          ]),
        )
        .min(1),
      notes: z.array(z.string()).optional(),
      nutrition: z.record(z.string(), z.string()).optional(),
      datePublished: z.coerce.date().optional(),
      dateUpdated: z.coerce.date().optional(),
    }),
});

export const collections = { recipes };
