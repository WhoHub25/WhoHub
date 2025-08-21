# WhoHub Deployment Guide - Netlify + GoDaddy

## Overview
This guide shows how to deploy WhoHub to Netlify and connect it to your GoDaddy domain (www.whohub.com.au).

## Prerequisites
- GitHub account with WhoHub repository
- Netlify account (free)
- GoDaddy domain (whohub.com.au)

## Step 1: Deploy to Netlify

1. **Go to [Netlify](https://netlify.com)**
2. **Sign up/Login** with GitHub
3. **Click "New site from Git"**
4. **Select your WhoHub repository**
5. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Click "Deploy site"**

## Step 2: Configure Custom Domain in Netlify

1. **Go to your site settings in Netlify**
2. **Click "Domain management"**
3. **Click "Add custom domain"**
4. **Enter:** `whohub.com.au`
5. **Add another:** `www.whohub.com.au`

## Step 3: Configure DNS in GoDaddy

1. **Login to GoDaddy Domain Manager**
2. **Go to DNS Management for whohub.com.au**
3. **Add/Update these records:**

```
Type: CNAME
Name: www
Value: [your-netlify-site-name].netlify.app

Type: A (if needed for apex domain)
Name: @
Value: 75.2.60.5 (Netlify's Load Balancer IP)
```

4. **Wait 24-48 hours for DNS propagation**

## Step 4: Enable HTTPS

1. **In Netlify, go to Domain settings**
2. **Click "HTTPS"**
3. **Enable "Force HTTPS redirect"**
4. **Let's Encrypt SSL will be automatic**

## Your Site Will Be Live At:
- https://www.whohub.com.au
- https://whohub.com.au

## Backend API Note
The current OSINT backend will need to be hosted separately (like Railway, Heroku, or a VPS) since Netlify only hosts static sites. The frontend will connect to your backend API.