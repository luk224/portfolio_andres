import { defineCollection, z } from "astro:content";
// z -> zod schema
const projects = defineCollection({
    schema: z.object({
        title: z.string(),
        author: z.string(),
        description: z.string(),
        img: z.string(),
        experience: z.string(),
        extra: z.object({
            youtube: z.string().url(),
            website: z.string().url(),
        }),
        tech: z.array(
            z.object({
                name: z.string(),
                logo: z.string(),
            })
        ).optional(), // 👈 makes the whole field optional
    })
})

export const collections = {projects}