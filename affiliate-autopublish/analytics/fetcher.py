"""
Platform analytics fetcher — pulls view/play counts from each platform API daily.
Extend as needed; the dashboard currently uses local click tracking from the DB.
"""
# YouTube: use googleapiclient.discovery build("youtube","v3").videos().list()
# Meta: GET /v18.0/{video-id}/insights
# TikTok: GET /v2/video/query/
# These require the respective OAuth tokens already set up in .env
