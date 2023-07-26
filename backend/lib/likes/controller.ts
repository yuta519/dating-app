import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

import { LikeRepository } from "./repository";
import { Like } from "./like";

export const getLikedProfiles = async (
  req: Request<{ auth: { payload?: { sub?: string } } }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth?.payload?.sub;
    const profiles = await LikeRepository.fetchLikeProrilesByUserId(userId);
    res.json(profiles);
  } catch (err) {
    next(err);
  }
};

export const postLike = async (
  req: Request<{ auth: any; body: { like_to: string } }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const isValidReq = validationResult(req).isEmpty();
    if (!isValidReq) throw "Request body is invalid";

    const exists = await LikeRepository.exists({
      sentBy: req.auth?.payload?.sub,
      receivedBy: req.body.like_to,
    });
    if (exists) throw "You already liked this person";

    const like = new Like(req.auth?.payload?.sub, req.body.like_to);
    await LikeRepository.create(like.toHash());
    res.status(201);
  } catch (err) {
    next(err);
  }
};
