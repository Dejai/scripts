#!/usr/bin/env python3

# TUS Client as described here: https://github.com/tus/tus-py-client
from tusclient import client
import argparse 
import os
import sys

# Setup parser for script arguments
parser = argparse.ArgumentParser(prog='uploadStream',description='Upload local files to Cloudflare Stream')

# Add the expected params for the parser
parser.add_argument('-a', '--account', type=str, help='The Cloudflare Account number', required=False)
parser.add_argument('-t', '--token', type=str, help='The API token from Cloudflare', required=False)
parser.add_argument('-f', '--file', type=str, help="The full path to the file to upload", required=True)
args = parser.parse_args()

# Check that Account ID and API Token are provided or set via environment variable
accountID = os.environ.get("CF_ACCOUNT_ID", args.account)
apiToken = os.environ.get("CF_API_TOKEN", args.token)

# Ensure the two values are set
if accountID is None or apiToken is None:
    print("An Account ID and API token are both necessary to run this script. See help details via: python3 ./uploadStream.py -h")
    sys.exit()

# Setup the key ingredients for TUS process
apiPath = "https://api.cloudflare.com/client/v4/accounts/{0}/stream".format(accountID)
bearerToken = "Bearer {0}".format(apiToken)
chunkSize = 52428800
filePath = args.file
_,fileName = os.path.split(filePath)

# BEGIN PROCESS:
print("Processing file:")
print("\tPath: {0}".format(filePath))
print("\tName: {0}".format(fileName))

# Setup the the TusClient with Auth header
myTusClient = client.TusClient(apiPath, headers={ "Authorization": bearerToken})

# TusUploader
myTusUploader = myTusClient.uploader(file_path=filePath, chunk_size=chunkSize, metadata={"name":fileName})

# This uploads chunk by chunk.
myTusUploader.upload()