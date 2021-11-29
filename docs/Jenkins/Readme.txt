1)Commit changes to Github
2)Configure Jenkins to fetch Jenkinsfile and code from Github including package.json file
3)create Jenkinsfile (all stages will run on dynamically provisioned Docker containers, having matthewhartstonge/node-docker image, on permanent/pre-configured agent nodes)
we are uisng this image: 'matthewhartstonge/node-docker'
https://hub.docker.com/r/matthewhartstonge/node-docker
this image is used for the Docker agent for all the pipeline stages.  it must contain:
    a)NodeJS to execute npm install command (from Build stage)
    b)Docker CLI to execute Docker commands (from Build image & push it to DockerHub)
the build container is running inside the Jenkins master container so we are running Docker inside a Docker
4)Build stage: call "npm install" to make sure all external dependencies of our app can be installed based on the package.json file fetched from GitHub.
5)Testing (unit/integration): run "npm test" (to be done)
6)Now that we have successfully built and unit-tested our application, we can configure our pipeline to build a Docker
image for our App (AT or Production) and push it to a registry:
    a)Add step to create image based on Dockerfile (for AT) that contains NodeJS (no need for Docker CLI)
    b)push image to Dockerhub
7)Acceptance/Integration Testing
    a)run AT container from the image we built for the application on the staging/pre-production server
  (not on Jenkins agent). In order to run it remotely, we need to use -H option or configure the DOCKER_HOST environement variable
    b)run the test container from an image containing curl to test the production/AT container (just making sure it
    can access the endpoint of our API. We are using curl for this task)