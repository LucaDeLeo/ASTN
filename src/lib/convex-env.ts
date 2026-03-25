import { dev } from '$app/environment'
import {
  PUBLIC_CONVEX_SITE_URL,
  PUBLIC_CONVEX_URL,
} from '$env/static/public'

const localConvexUrl = import.meta.env.PUBLIC_CONVEX_URL
const localConvexSiteUrl = import.meta.env.PUBLIC_CONVEX_SITE_URL

export const CONVEX_URL = dev && localConvexUrl ? localConvexUrl : PUBLIC_CONVEX_URL
export const CONVEX_SITE_URL =
  dev && localConvexSiteUrl ? localConvexSiteUrl : PUBLIC_CONVEX_SITE_URL
