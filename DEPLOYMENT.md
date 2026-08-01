# CamTech Deployment Guide (Ubuntu + Docker + Cloudflare Tunnels)

This guide walks you through deploying the CamTech monorepo on an Ubuntu server. We have integrated **Cloudflare Tunnels** directly into the `docker-compose.yml`, which means you **do not need to open any inbound ports** on your Ubuntu server firewall. 

---

## Prerequisites

1. An **Ubuntu Server** with SSH access.
2. A **Cloudflare account** with your domain already set up and active.
3. Your code pushed to a Git repository (e.g. GitHub/GitLab).

---

## Step 1: Prepare the Ubuntu Server

SSH into your server and install Docker and Git.

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Git and Curl
sudo apt install git curl -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin -y

# Add your user to the Docker group
sudo usermod -aG docker $USER
```
*(After running the last command, log out and log back in to apply the group change).*

---

## Step 2: Set up Cloudflare Tunnel via Zero Trust Dashboard

1. Turn on "Under Attack Mode" (If under active attack)
   - Go to your Cloudflare Dashboard -> **Security** -> **Settings**.
   - Set Security Level to **I'm Under Attack!**. 
   - ⚠️ **WARNING**: If you turn this on, Cloudflare will challenge EVERY request with an HTML page. This will block your app's background API requests (throwing a `JSON.parse` error). Do not leave this on permanently, or if you do, create a WAF rule to `Skip` the challenge for URI paths matching `/api/*`.

2. Go to your Cloudflare Dashboard.
3. Click on **Zero Trust** on the left sidebar.
4. Navigate to **Networks** -> **Tunnels**.
5. Click **Create a tunnel**.
6. Select **Cloudflared** as the connector type and click Next.
7. Name your tunnel (e.g., `camtech-server`) and click **Save tunnel**.

### Get Your Tunnel Token
On the installation screen, Cloudflare will show a command to run on Docker. 
Look closely at the command they provide; you need to copy **ONLY the long token string** (it usually starts with `eyJhIjoi...`).

Save this token; you will need it in the next step.

### Route Traffic to the Container
1. Click **Next** (or go to the **Public Hostname** tab of your tunnel).
2. **Public Hostname:**
   - **Subdomain:** (Optional) e.g., `savemedia`.
   - **Domain:** Select your domain.
3. **Service:**
   - **Type:** `HTTP`
   - **URL:** `camtech-savemedia-frontend:80` *(This matches the container name in our docker-compose)*

Click **Save hostname**.

---

## Step 3: Clone and Configure

Clone your CamTech project onto the server.

```bash
git clone https://github.com/yourusername/CamTech.git
cd CamTech

# Create the .env file
cp .env.example .env
```

Edit the `.env` file:
```bash
nano .env
```
Make sure you paste the token from Step 2 at the bottom:
`CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...`

*(Don't forget to upload your `credentials/` folder if it wasn't tracked in Git!)*

---

## Step 4: Start the Services

Now, start your application!

```bash
cd ~/CamTech

# Build and start all services (including the tunnel) in detached mode
docker compose up -d --build
```

### Check the Status
Ensure everything is running smoothly:
```bash
docker compose ps
```

You should see all containers (including `camtech-tunnel`) showing an `Up` status.
Your Cloudflare Zero Trust dashboard should now show the tunnel status as **Healthy**.

---

## Step 5: Test Your Deployment

1. **Web Downloader:** Open a browser and navigate to the domain you configured. The SaveMedia UI will load securely via Cloudflare SSL.
2. **Auto Post Bot:** Send a message to your Telegram bot to verify it is running.

---

## Step 6: Automated CI/CD (GitHub Actions)

We have configured a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically pulls the latest code and runs `update.py` whenever you push to the `main` branch. 

Because your server is behind Cloudflare (with no open ports), you must install a **Self-Hosted Runner** on your Ubuntu server to listen for GitHub events.

### Installing the Self-Hosted Runner
1. Go to your repository on GitHub.com.
2. Click **Settings** > **Actions** > **Runners**.
3. Click **New self-hosted runner** and select **Linux** as the OS and **x64** as the Architecture.
4. SSH into your Ubuntu server and copy-paste the `Download` and `Configure` commands provided by GitHub.
5. During configuration, press **Enter** to accept the default values for the runner group, name, and labels.

### Run it as a Background Service
After configuring the runner, install it as a background service so it stays online:
```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

Now, every time you run `git push origin main` from your local PC, your server will instantly and securely update itself!
