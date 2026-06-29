import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import type {
  FavoriteSource,
  FavoriteSourceInput
} from "@/features/favorite-sources/types";

const demoFavoriteSourcesPath = path.join(
  process.cwd(),
  "data",
  "demo-favorite-sources.json"
);

async function readDemoFavoriteSources() {
  const raw = await readFile(demoFavoriteSourcesPath, "utf8");
  return JSON.parse(raw) as FavoriteSource[];
}

async function writeDemoFavoriteSources(sources: FavoriteSource[]) {
  await writeFile(
    demoFavoriteSourcesPath,
    `${JSON.stringify(sources, null, 2)}\n`
  );
}

export class FavoriteSourceRepository {
  async list(householdId: string, isDemo: boolean): Promise<FavoriteSource[]> {
    if (isDemo) {
      const sources = await readDemoFavoriteSources();
      return sources.sort((first, second) => second.rankingBoost - first.rankingBoost);
    }

    const sources = await prisma.favoriteSource.findMany({
      where: { householdId },
      orderBy: [{ rankingBoost: "desc" }, { name: "asc" }]
    });

    return sources.map((source) => ({
      id: source.id,
      type: source.type,
      name: source.name,
      url: source.url,
      rankingBoost: source.rankingBoost,
      notes: source.notes
    }));
  }

  async create(householdId: string, isDemo: boolean, input: FavoriteSourceInput) {
    if (isDemo) {
      const sources = await readDemoFavoriteSources();
      sources.unshift({
        id: randomUUID(),
        ...input,
        url: input.url ?? null,
        notes: input.notes ?? null
      });
      await writeDemoFavoriteSources(sources);
      return;
    }

    await prisma.favoriteSource.create({
      data: {
        householdId,
        type: input.type,
        name: input.name,
        url: input.url,
        rankingBoost: input.rankingBoost,
        notes: input.notes
      }
    });
  }

  async update(
    householdId: string,
    isDemo: boolean,
    id: string,
    input: FavoriteSourceInput
  ) {
    if (isDemo) {
      const sources = await readDemoFavoriteSources();
      const index = sources.findIndex((source) => source.id === id);

      if (index !== -1) {
        sources[index] = {
          id,
          ...input,
          url: input.url ?? null,
          notes: input.notes ?? null
        };
        await writeDemoFavoriteSources(sources);
      }

      return;
    }

    await prisma.favoriteSource.updateMany({
      where: { id, householdId },
      data: {
        type: input.type,
        name: input.name,
        url: input.url,
        rankingBoost: input.rankingBoost,
        notes: input.notes
      }
    });
  }

  async delete(householdId: string, isDemo: boolean, id: string) {
    if (isDemo) {
      const sources = await readDemoFavoriteSources();
      await writeDemoFavoriteSources(
        sources.filter((source) => source.id !== id)
      );
      return;
    }

    await prisma.favoriteSource.deleteMany({
      where: { id, householdId }
    });
  }
}
