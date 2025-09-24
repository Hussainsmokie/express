pipeline {
    agent any

    tools {
        nodejs 'node24'   // Adjust to match your Jenkins NodeJS tool name
    }

    environment {
        SONAR_TOKEN = credentials('sonar-token')
        SCANNER_HOME = tool 'sonarqube'
        SONAR_HOST_URL = 'http://3.110.189.221:9000' //this has to be changed whenever we spin an container
    }

    stages {
        stage('Git Checkout') {
            steps {
                git url: 'https://github.com/Hussainsmokie/express.git', branch: 'master'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar') {
                    sh '''
                        ${SCANNER_HOME}/bin/sonar-scanner \
                          -Dsonar.projectKey=express-app \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=${SONAR_HOST_URL} \
                          -Dsonar.login=${SONAR_TOKEN}
                    '''
                }
            }
        }

        stage('Trivy FS Scan') {
            steps {
                sh '''
                    trivy fs . --format table --output trivy-fs-report.txt || true
                '''
            }
        }

        stage('Trivy Dependency Scan') {
            steps {
                sh '''
                    trivy fs . --format json --output trivy-dependency-report.json || true
                '''
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    timeout(time: 2, unit: 'MINUTES') {
                        def qg = waitForQualityGate(abortPipeline: false)
                        echo "Quality Gate status: ${qg.status}"
                    }
                }
            }
        }
    }

    post {
        always {
            // Archive Trivy reports
            archiveArtifacts artifacts: '**/trivy-*.txt, **/trivy-*.json', allowEmptyArchive: true
            
            // Send email notification
            script {
                def buildStatus = currentBuild.currentResult
                def buildUser = currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause')[0]?.userId ?: 'Github User'
                
                emailext (
                    subject: "Pipeline ${buildStatus}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: """
                        <p>This is a Sonar Scanner pipeline CICD pipeline status.</p>
                        <p>Project: ${env.JOB_NAME}</p>
                        <p>Build Number: ${env.BUILD_NUMBER}</p>
                        <p>Build Status: ${buildStatus}</p>
                        <p>Started by: ${buildUser}</p>
                        <p>Build URL: <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    """,
                    to: 'nousath1609@gmail.com',
                    from: 'nousath1609@gmail.com',
                    replyTo: 'nousath1609@gmail.com',
                    mimeType: 'text/html',
                    attachmentsPattern: 'trivy-fs-report.txt,trivy-dependency-report.json'
                )
            }
        }
    }
}
