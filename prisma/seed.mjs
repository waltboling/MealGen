import { Prisma, PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const HOUSEHOLD_ID = "00000000-0000-4000-8000-000000000001";
const USER_ID = "00000000-0000-4000-8000-000000000002";

async function main() {
  const raw = await readFile(
    path.join(process.cwd(), "data", "demo-recipes.json"),
    "utf8"
  );
  const recipes = JSON.parse(raw);
  const rawHousehold = await readFile(
    path.join(process.cwd(), "data", "demo-household.json"),
    "utf8"
  );
  const demoHousehold = JSON.parse(rawHousehold);

  for (const accountUser of demoHousehold.accountUsers) {
    await prisma.userProfile.upsert({
      where: { id: accountUser.id },
      update: {
        email: accountUser.email,
        name: accountUser.name
      },
      create: {
        id: accountUser.id,
        email: accountUser.email,
        name: accountUser.name
      }
    });
  }

  await prisma.household.upsert({
    where: { id: HOUSEHOLD_ID },
    update: {
      name: demoHousehold.household.name
    },
    create: {
      id: HOUSEHOLD_ID,
      name: demoHousehold.household.name
    }
  });

  for (const accountUser of demoHousehold.accountUsers) {
    await prisma.householdMembership.upsert({
      where: {
        householdId_userId: {
          householdId: HOUSEHOLD_ID,
          userId: accountUser.id
        }
      },
      update: {
        role: accountUser.role,
        status: accountUser.status
      },
      create: {
        householdId: HOUSEHOLD_ID,
        userId: accountUser.id,
        role: accountUser.role,
        status: accountUser.status
      }
    });
  }

  for (const member of demoHousehold.profiles) {
    await prisma.householdMember.upsert({
      where: { id: member.id },
      update: {
        linkedUserId: member.linkedUserId,
        name: member.name,
        profileType: member.profileType,
        active: member.active,
        temporary: member.temporary,
        activeFrom: member.activeFrom
          ? new Date(`${member.activeFrom}T00:00:00.000Z`)
          : null,
        activeUntil: member.activeUntil
          ? new Date(`${member.activeUntil}T00:00:00.000Z`)
          : null,
        color: member.color,
        initials: member.initials,
        likes: member.likes,
        dislikes: member.dislikes,
        allergies: member.allergies,
        dietaryPreferences: member.dietaryPreferences,
        favoriteCuisines: member.favoriteCuisines,
        preferredSpiceLevel: member.preferredSpiceLevel,
        notes: member.notes
      },
      create: {
        id: member.id,
        householdId: HOUSEHOLD_ID,
        linkedUserId: member.linkedUserId,
        name: member.name,
        profileType: member.profileType,
        active: member.active,
        temporary: member.temporary,
        activeFrom: member.activeFrom
          ? new Date(`${member.activeFrom}T00:00:00.000Z`)
          : null,
        activeUntil: member.activeUntil
          ? new Date(`${member.activeUntil}T00:00:00.000Z`)
          : null,
        color: member.color,
        initials: member.initials,
        likes: member.likes,
        dislikes: member.dislikes,
        allergies: member.allergies,
        dietaryPreferences: member.dietaryPreferences,
        favoriteCuisines: member.favoriteCuisines,
        preferredSpiceLevel: member.preferredSpiceLevel,
        notes: member.notes
      }
    });
  }

  for (const invitation of demoHousehold.invitations) {
    await prisma.householdInvitation.upsert({
      where: { id: invitation.id },
      update: {
        email: invitation.email,
        role: invitation.role,
        status: invitation.status
      },
      create: {
        id: invitation.id,
        householdId: HOUSEHOLD_ID,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status
      }
    });
  }

  for (const recipe of recipes) {
    await prisma.recipe.upsert({
      where: { id: recipe.id },
      update: {},
      create: {
        id: recipe.id,
        householdId: HOUSEHOLD_ID,
        createdByUserId: USER_ID,
        title: recipe.title,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        sourceName: recipe.sourceName,
        sourceUrl: recipe.sourceUrl || null,
        authorName: recipe.authorName,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        servings: recipe.servings,
        isCustom: true,
        ingredients: {
          create: recipe.ingredients.map((ingredient) => ({
            id: ingredient.id,
            displayText: ingredient.displayText,
            name: ingredient.name,
            normalizedName: ingredient.name.toLowerCase(),
            quantity:
              ingredient.quantity == null
                ? undefined
                : new Prisma.Decimal(ingredient.quantity),
            unit: ingredient.unit || null,
            position: ingredient.position
          }))
        },
        instructions: {
          create: recipe.instructions.map((instruction) => ({
            id: instruction.id,
            step: instruction.step,
            text: instruction.text
          }))
        },
        notes: {
          create: recipe.notes.map((note) => ({
            id: note.id,
            text: note.text,
            createdAt: new Date(note.createdAt)
          }))
        },
        tags: {
          create: recipe.tags.map((name) => ({ name }))
        }
      }
    });
  }

  const rawPlans = await readFile(
    path.join(process.cwd(), "data", "demo-meal-plans.json"),
    "utf8"
  );
  const plans = JSON.parse(rawPlans);

  for (const plan of plans) {
    const savedPlan = await prisma.mealPlan.upsert({
      where: {
        householdId_weekStartDate: {
          householdId: HOUSEHOLD_ID,
          weekStartDate: new Date(`${plan.weekStartDate}T00:00:00.000Z`)
        }
      },
      update: {},
      create: {
        id: plan.id,
        householdId: HOUSEHOLD_ID,
        weekStartDate: new Date(`${plan.weekStartDate}T00:00:00.000Z`),
        status: plan.status,
        notes: plan.notes
      }
    });

    for (const meal of plan.meals) {
      await prisma.mealPlanMeal.upsert({
        where: { id: meal.id },
        update: {},
        create: {
          id: meal.id,
          mealPlanId: savedPlan.id,
          recipeId: meal.recipeId,
          mealType: meal.mealType,
          plannedForDate: new Date(`${meal.plannedForDate}T00:00:00.000Z`),
          servings: meal.servings,
          notes: meal.notes,
          participants: {
            create: meal.participantMemberIds.map((householdMemberId) => ({
              householdMemberId
            }))
          }
        }
      });
    }
  }

  const rawGroceryLists = await readFile(
    path.join(process.cwd(), "data", "demo-grocery-lists.json"),
    "utf8"
  );
  const groceryLists = JSON.parse(rawGroceryLists);

  for (const groceryList of groceryLists) {
    const savedList = await prisma.groceryList.upsert({
      where: { id: groceryList.id },
      update: {},
      create: {
        id: groceryList.id,
        householdId: HOUSEHOLD_ID,
        mealPlanId: groceryList.mealPlanId,
        name: groceryList.name
      }
    });

    for (const item of groceryList.items) {
      await prisma.groceryListItem.upsert({
        where: { id: item.id },
        update: {},
        create: {
          id: item.id,
          groceryListId: savedList.id,
          name: item.name,
          normalizedName: item.normalizedName,
          quantity:
            item.quantity == null
              ? undefined
              : new Prisma.Decimal(item.quantity),
          unit: item.unit,
          category: item.category,
          checked: item.checked,
          source: item.source
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
