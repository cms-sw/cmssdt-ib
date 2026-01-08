# CMSSDT IB page

This is source code for new [CMSSDT IB page](https://cmssdt.cern.ch/SDT/html/cmssdt-ib). It must be transpiled before deploying.

## To start local development
```sh
# Start node container
docker run -it --rm --name my-running-script -v "$PWD":/usr/src/app:z -w /usr/src/app -p 3000:3000  node:18 bash  # starts NPM in docker enviroment
# populate enviroment with latest testing data
./public/updateData.sh
# install dependencies
npm install
# For development server
npm run start
# For testing the changes in production build
npm run build
npx serve -s build
```

Open browser and access localhost:3000

## Documentation

- https://5c507d49471426000887a6a7--react-bootstrap.netlify.com/components/alerts/
