import { device } from "@prisma/client";
import { Request, Response } from "express";

declare global {
  namespace Express {
    interface Locals {
      device: device;
    }
  }
}
