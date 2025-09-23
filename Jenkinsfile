pipeline {
    agent any

    tools {
        nodejs 'node24'   // Make sure this matches your Jenkins NodeJS tool name
    }

    environment {
        SONAR_TOKEN = credentials('sonar-token')
        SCANNER_HOME = tool 'sonarqube'
        SONAR_HOST_URL = 'http://13.201.89.196:9000'
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
            archiveArtifacts artifacts: '**/trivy-*.{txt,json}', allowEmptyArchive: true
        }
    }
}
