"""
TikTok video uploading logic.
Uses the Web Video Kit (Inbox) API for video.upload scope.
"""
import os
import math
import requests
from utils.logger import get_logger
from tiktok.auth import get_tiktok_access_token

logger = get_logger("tiktok.uploader")

TIKTOK_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/"

# TikTok chunk limits
MIN_CHUNK_SIZE = 5 * 1024 * 1024      # 5 MB
MAX_CHUNK_SIZE = 64 * 1024 * 1024     # 64 MB

def upload_to_tiktok(file_path: str, title: str) -> bool:
    """
    Uploads a video to TikTok using the Web Video Kit (Inbox) API.
    The video will appear in the user's TikTok Inbox as a draft.
    Returns True on success, False otherwise.
    """
    access_token = get_tiktok_access_token()
    if not access_token:
        logger.error("❌ No TikTok access token found. Please authenticate first.")
        return False

    if not os.path.exists(file_path):
        logger.error(f"❌ File not found: {file_path}")
        return False

    file_size = os.path.getsize(file_path)
    
    # Clean up title for TikTok (max 150 chars)
    clean_title = (title[:140] + '...') if len(title) > 140 else title

    # Calculate chunking
    if file_size <= MAX_CHUNK_SIZE:
        chunk_size = file_size
        total_chunks = 1
    else:
        total_chunks = math.ceil(file_size / MAX_CHUNK_SIZE)
        chunk_size = math.ceil(file_size / total_chunks)

    logger.info(f"📤 Initializing TikTok upload for: '{clean_title}'")
    logger.info(f"   File size: {file_size / (1024*1024):.1f} MB, Chunks: {total_chunks}")
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8"
    }
    
    # Step 1: Initialize Upload
    init_payload = {
        "source_info": {
            "source": "FILE_UPLOAD",
            "video_size": file_size,
            "chunk_size": chunk_size,
            "total_chunk_count": total_chunks
        }
    }
    
    response = requests.post(TIKTOK_INIT_URL, headers=headers, json=init_payload)
    if response.status_code != 200:
        logger.error(f"❌ TikTok init failed: {response.status_code} - {response.text}")
        return False
        
    init_data = response.json()
    if "error" in init_data and init_data["error"].get("code") != "ok":
        logger.error(f"❌ TikTok API Error: {init_data['error']['message']}")
        return False
        
    upload_url = init_data["data"]["upload_url"]
    publish_id = init_data["data"]["publish_id"]
    
    # Step 2: Upload Video File (chunked)
    logger.info(f"📤 Uploading video to TikTok (Publish ID: {publish_id})...")
    
    with open(file_path, "rb") as f:
        for chunk_index in range(total_chunks):
            offset = chunk_index * chunk_size
            # Last chunk may be smaller
            current_chunk_size = min(chunk_size, file_size - offset)
            chunk_data = f.read(current_chunk_size)
            
            end_byte = offset + current_chunk_size - 1
            
            upload_headers = {
                "Content-Type": "video/mp4",
                "Content-Length": str(current_chunk_size),
                "Content-Range": f"bytes {offset}-{end_byte}/{file_size}"
            }
            
            logger.info(f"   Chunk {chunk_index + 1}/{total_chunks}: bytes {offset}-{end_byte}")
            upload_response = requests.put(upload_url, headers=upload_headers, data=chunk_data)
            
            if upload_response.status_code not in (200, 201):
                logger.error(f"❌ TikTok chunk upload failed: {upload_response.status_code} - {upload_response.text}")
                return False
        
    logger.info(f"✅ Successfully uploaded video to TikTok! (Publish ID: {publish_id})")
    logger.info("   Video will appear in your TikTok Inbox shortly.")
    return True
