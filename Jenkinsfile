pipeline {
    agent {
        docker {
            image "matthewhartstonge/node-docker"
            args "-p 3000:3000"
            args "-v /var/run/docker.sock:/var/run/docker.sock"
        }
    }
    stages {
         stage("Build") {
            steps{
            //installing all the dependency from the package.json file
                sh 'npm install'
            }
        }
        stage("Unit Testing"){
            steps{
                echo 'Run the npm test command'
            }
        }
        stage("Build and push Docker image"){
            steps{
                echo "run the commands docker image build, push on /docker/DockerFile"
            }
        }
        stage("Acceptance Testing"){
            steps{
                echo '***** AT stage *********'
            }
        }
    }
}