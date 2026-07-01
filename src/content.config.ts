import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';
// The 13 course slugs live in one place (docs/taxonomy.md §1) so the Zod enum and the
// browse UI can never drift apart.
import { COURSE_SLUGS } from './lib/taxonomy';

const COURSES = COURSE_SLUGS;

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
      contributor: z.string().optional(),
      course: z.enum(COURSES),
      cuisine: z.string().optional(),
      tags: z.array(kebab).optional(),
      image: z.object({ src: image(), alt: z.string() }).optional(),
      servings: z.number().int().positive().optional(),
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
      // Whitelisted to schema.org NutritionInformation fields (strict — rejects typos).
      nutrition: z
        .object({
          calories: z.string().optional(),
          servingSize: z.string().optional(),
          fatContent: z.string().optional(),
          saturatedFatContent: z.string().optional(),
          carbohydrateContent: z.string().optional(),
          sugarContent: z.string().optional(),
          proteinContent: z.string().optional(),
          fiberContent: z.string().optional(),
          sodiumContent: z.string().optional(),
          cholesterolContent: z.string().optional(),
        })
        .strict()
        .optional(),
      datePublished: z.coerce.date().optional(),
      dateUpdated: z.coerce.date().optional(),
    }),
});

export const collections = { recipes };
