# CMSSDT IB page

This is source code for new [CMSSDT IB page](https://cmssdt.cern.ch/SDT/html/cmssdt-ib-react19).  
It uses **React 19** and **Vite**. It must be built before deploying.

## To start local development

```bash
# Start node container
docker run -it --rm --name my-running-script -v "$PWD":/usr/src/app:z -w /usr/src/app -p 5173:5173 node:20 bash

# populate environment with latest testing data
./public/updateData.sh

# install dependencies
npm install

# For development server
npm run start

# For testing the changes in production build
npm run build
npm run preview

Open browser and access localhost:5173