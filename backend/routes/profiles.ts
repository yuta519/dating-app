import { PrismaClient } from "@prisma/client";
import express from "express";
import { convertAgetoDate } from "../utils/caluculateAge";

const router = express.Router();

const convertLookingForToGender = (lookingFor: string) => {
  switch (lookingFor) {
    case "Men":
      return "Man";
    case "Women":
      return "Woman";
    default:
      return undefined;
  }
};

router.post("/profileId", async (req, res) => {
  const client = new PrismaClient();
  const { userId } = req.body;
  const result = await client.profile.findUnique({
    where: {
      userId: userId,
    },
    select: {
      id: true,
    },
  });
  return res.json(result);
});

router.post("/", async (req, res) => {
  const client = new PrismaClient();
  const { profileId } = req.body;
  const filter = await client.filter.findUnique({
    where: {
      profileId: profileId,
    },
    include: { interests: { select: { name: true } } },
  });

  if (filter) {
    const profiles = await client.profile.findMany({
      where: {
        id: { not: profileId },
        gender: convertLookingForToGender(filter.showMe),
        birthday: filter.isAgeFiltered
          ? {
              gte: convertAgetoDate(filter.maxAge),
              lte: convertAgetoDate(filter.minAge),
            }
          : undefined,
        sexualOrientation: filter.isSexualOrientationFiltered
          ? { in: filter.sexualOrientations }
          : undefined,
        interests: filter.isInterestFiltered
          ? { some: { OR: filter.interests } }
          : undefined,
        purposes: filter.isPurposeFiltered
          ? {
              some: {
                OR: filter.purposes.map((purpose) => ({ name: purpose })),
              },
            }
          : undefined,
      },
      include: {
        interests: { select: { name: true } },
        purposes: { select: { name: true } },
      },
    });
    return res.json(profiles);
  }
});

export default router;
