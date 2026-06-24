@echo off
echo ========================================================
echo Auto Post Bot - Ubuntu Docker Deployment
echo ========================================================
echo.
echo Step 1/3: Packing project files (skipping .venv)...
tar -czf deploy.tar.gz --exclude=.venv --exclude=__pycache__ --exclude=downloads --exclude=.git *
echo.
echo Step 2/3: Copying archive to Ubuntu server (10.1.0.11)...
echo Please enter the password for ubuntu-server if prompted.
scp deploy.tar.gz ubuntu-server@10.1.0.11:/home/ubuntu-server/
echo.
echo Step 3/3: Installing Docker and starting the bot...
echo Please enter the password for ubuntu-server if prompted.
ssh -t ubuntu-server@10.1.0.11 "mkdir -p /home/ubuntu-server/AUTO_POST && tar -xzf deploy.tar.gz -C /home/ubuntu-server/AUTO_POST && cd /home/ubuntu-server/AUTO_POST && chmod +x setup_ubuntu.sh && ./setup_ubuntu.sh"
echo.
echo Cleaning up temporary files...
del deploy.tar.gz
ssh ubuntu-server@10.1.0.11 "rm deploy.tar.gz"
echo.
echo ========================================================
echo Deployment Complete!
echo You can close this window now.
pause
