# CMSSDT IB page

This is source code for new [CMSSDT IB page](https://cmssdt.cern.ch/SDT/html/cmssdt-ib). It must be transpiled before deploying.

## To start local development
```sh
docker run -it --rm --name my-running-script -v "$PWD":/usr/src/app:z -w /usr/src/app -p 3000:3000  node:8 bash  # starts NPM in docker enviroment
cd public && ./updateData.sh && cd ..  # populate enviroment with latest testing data 
npm install  # install dependencies
npm run start  # run development server
```

## Documentation

- https://5c507d49471426000887a6a7--react-bootstrap.netlify.com/components/alerts/
