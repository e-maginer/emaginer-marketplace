## Analysis of external dependencies
   One of the first steps in the modernization process is to discover and list all external dependencies of the legacy application.
   We need to ask ourselves questions like the following: 
   1. Does it use a database? If yes, which one? What does the connection string look like? 
   Yes, MongoDB. Connection string is different depending upon the environment.
   - Dev: mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs
   - Prod: mongodb+srv://taskapp:Tmuhader@123@cluster0.3eqdx.mongodb.net/task-manager-api?retryWrites=true&w=majority
   2. Does it use external APIs such as credit card approval or geo-mapping APIs? What are the API keys and key secrets? 
No. to be defined
   3. Is it consuming from or publishing to an Enterprise Service Bus (ESB)?
No. to be defined.
  

## Source code and build instructions
  
The next step is to locate all the source code and other assets, such as JS, images and CSS and HTML files that are part of the application. 
Ideally, they should be located in a single folder (src folder). This folder will be the root of our project and can have as many 
subfolders as needed. This project root folder will be the context during the build of the container image we want to create for 
our legacy application. Remember, the Docker builder only includes files in the build that are part of that context; in our case,
 that is the root project folder.
Once we are aware of all the parts that are contributing to the final application, we need to investigate how the application 
is built and packaged. Once again, let's extend our inventory and write down the exact build commands used. We will need 
this information later on when authoring the Dockerfile.
                      
                      
## Configuration
           
We can differentiate a few types of configurations, as follows: 
1. Build time: This is the information needed during the build of the application and/or its Docker image. It needs to be available 
when we create the Docker images. 

2. Environment: This is configuration information that varies with the environment in which the application is running—for 
example, DEVELOPMENT versus STAGING or PRODUCTION. This kind of configuration is applied to the application when a container 
with the app starts—for example, in production. 
All configuration variables defined in the config files
3. Runtime: This is information that the application retrieves during runtime, such as secrets to access an external API.

##Secrets

Every mission-critical enterprise application needs to deal with secrets in some form or another. The most familiar secrets 
are part of the connection information needed to access databases that are used to persist the data produced by or used by 
the application. Other secrets include the credentials needed to access external APIs, such as a credit score lookup API. 
It is important to note that, here, we are talking about secrets that have to be provided by the application itself to 
the service providers the application uses or depends on, and not secrets provided by the users of the application. 
The actor here is our application, which needs to be authenticated and authorized by external authorities and service providers.

## Authoring the Dockerfile
1. The base image
2. Assembling the sources (WORKDIR and COPY)
3. Building the application (RUN, ENV and EXPOSE)
4. Defining the start command (ENTRYPOINT and CMD)
5. Sharing or shipping images (tagging and pushing to registry)

## Dev application execution
1. cd  ~/Dev/WebstormProjects/Emaginer/Emaginer-marketplace (or open terminal in WS)
2. Build the application image; execute the command 
- Dev:

``
docker image build -t emaginer-dev-img -f docker/DockerfileDev .
`` 

- Prod:

``
 docker image build -t emaginer-prod-img -f docker/Dockerfile .
``

3. Verify the image history
``
docker image history emaginer-dev
``
4. Spawn the API container:
- Dev:

``
docker run --rm --name emaginer-api -it -v $(pwd):/emaginer-app -p 3000:3000 emaginer-dev-img
``
- Prod:

``
docker run --rm --name emaginer-prod -it -p 3000:3000 emaginer-prod-img
``

