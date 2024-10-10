#!/bin/bash

# Define color output for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Full Security and Best Practices Scanner...${NC}"

# Create output directory for reports
mkdir -p security-reports

# Detect project language/framework based on common files
is_python=false
is_javascript=false
is_ruby=false
is_java=false
is_flutter=false
is_docker=false
is_rust=false
is_anchor=false

# -------------------- Language/Framework Detection --------------------
if [ -f "requirements.txt" ] || [ -f "*.py" ]; then
    is_python=true
fi

if [ -f "package.json" ]; then
    is_javascript=true
fi

if [ -f "Gemfile" ] || [ -f "*.rb" ]; then
    is_ruby=true
fi

if [ -f "pom.xml" ] || [ -f "*.java" ]; then
    is_java=true
fi

if [ -f "pubspec.yaml" ]; then
    is_flutter=true
fi

if [ -f "Dockerfile" ]; then
    is_docker=true
fi

if [ -f "Cargo.toml" ]; then
    is_rust=true
    # Anchor-specific detection
    if grep -q "anchor" Cargo.toml; then
        is_anchor=true
    fi
fi

# -------------------- Install Missing Tools --------------------

# Install tools as needed based on language detection

# Python Tools
if $is_python; then
    echo -e "${GREEN}Python project detected. Installing necessary tools...${NC}"
    pip install bandit pylint --quiet
fi

# JavaScript Tools
if $is_javascript; then
    echo -e "${GREEN}JavaScript/TypeScript project detected. Installing necessary tools...${NC}"
    npm install -g eslint prettier snyk --quiet
fi

# Ruby Tools
if $is_ruby; then
    echo -e "${GREEN}Ruby project detected. Installing necessary tools...${NC}"
    gem install brakeman rubocop --quiet
fi

# Java Tools
if $is_java; then
    echo -e "${GREEN}Java project detected. Installing necessary tools...${NC}"
    apt-get install checkstyle -y
    curl -L -o find-sec-bugs.jar https://repo1.maven.org/maven2/com/h3xstream/findsecbugs/findsecbugs-cli/1.10.1/findsecbugs-cli-1.10.1.jar
fi

# Docker Tools
if $is_docker; then
    echo -e "${GREEN}Docker project detected. Installing necessary tools...${NC}"
    apt-get install trivy -y
fi

# Flutter Tools
if $is_flutter; then
    echo -e "${GREEN}Flutter project detected. Installing necessary tools...${NC}"
    flutter pub get
    flutter pub add flutter_lints
fi

# Rust Tools
if $is_rust; then
    echo -e "${GREEN}Rust project detected. Installing necessary tools...${NC}"
    rustup component add clippy
    cargo install cargo-audit
fi

# Anchor Tools
if $is_anchor; then
    echo -e "${GREEN}Anchor project detected. Installing necessary tools...${NC}"
    cargo install anchor-cli
fi

# -------------------- Running Security and Best Practices Checks --------------------

# Python Security and Best Practices Check
if $is_python; then
    echo -e "${GREEN}Running Python security and best practices checks...${NC}"
    bandit -r . -f html -o security-reports/python-security-report.html
    pylint **/*.py --output-format=html > security-reports/python-lint-report.html
fi

# JavaScript/TypeScript Security and Best Practices Check
if $is_javascript; then
    echo -e "${GREEN}Running JavaScript/TypeScript security and best practices checks...${NC}"
    eslint . --format html --output-file security-reports/js-lint-report.html
    npm audit --json > security-reports/js-audit-report.json
    snyk test --json > security-reports/js-snyk-report.json
fi

# Ruby Security and Best Practices Check
if $is_ruby; then
    echo -e "${GREEN}Running Ruby security and best practices checks...${NC}"
    brakeman -o security-reports/ruby-security-report.html
    rubocop --format html --out security-reports/ruby-lint-report.html
fi

# Java Security and Best Practices Check
if $is_java; then
    echo -e "${GREEN}Running Java security and best practices checks...${NC}"
    checkstyle -c /google_checks.xml -r src > security-reports/java-checkstyle-report.txt
    java -jar find-sec-bugs.jar -progress -html -output security-reports/java-security-report.html src
fi

# Docker Security Check
if $is_docker; then
    echo -e "${GREEN}Running Docker security checks...${NC}"
    trivy image my-docker-image > security-reports/docker-security-report.txt
fi

# Flutter Security and Best Practices Check
if $is_flutter; then
    echo -e "${GREEN}Running Flutter security and best practices checks...${NC}"
    flutter analyze > security-reports/flutter-analyze-report.txt
fi

# Rust Security and Best Practices Check
if $is_rust; then
    echo -e "${GREEN}Running Rust security and best practices checks...${NC}"
    cargo clippy -- -D warnings
    cargo audit > security-reports/rust-audit-report.txt
fi

# Anchor Security and Best Practices Check
if $is_anchor; then
    echo -e "${GREEN}Running Anchor security checks and best practices...${NC}"
    anchor test > security-reports/anchor-test-report.txt
    cargo clippy --all-targets -- -D warnings # Anchor follows Rust best practices
fi

# -------------------- Summarize Reports --------------------

echo -e "${GREEN}Scan completed. Reports saved in 'security-reports' folder.${NC}"

if [ -d "security-reports" ]; then
    echo -e "\n${GREEN}Summary of Reports:${NC}"
    [ -f "security-reports/python-security-report.html" ] && echo "Python Security Report: security-reports/python-security-report.html"
    [ -f "security-reports/python-lint-report.html" ] && echo "Python Lint Report: security-reports/python-lint-report.html"
    [ -f "security-reports/js-lint-report.html" ] && echo "JavaScript Lint Report: security-reports/js-lint-report.html"
    [ -f "security-reports/js-audit-report.json" ] && echo "JavaScript NPM Audit Report: security-reports/js-audit-report.json"
    [ -f "security-reports/js-snyk-report.json" ] && echo "JavaScript Snyk Report: security-reports/js-snyk-report.json"
    [ -f "security-reports/ruby-security-report.html" ] && echo "Ruby Security Report: security-reports/ruby-security-report.html"
    [ -f "security-reports/ruby-lint-report.html" ] && echo "Ruby Lint Report: security-reports/ruby-lint-report.html"
    [ -f "security-reports/java-checkstyle-report.txt" ] && echo "Java Checkstyle Report: security-reports/java-checkstyle-report.txt"
    [ -f "security-reports/java-security-report.html" ] && echo "Java Security Report: security-reports/java-security-report.html"
    [ -f "security-reports/docker-security-report.txt" ] && echo "Docker Security Report: security-reports/docker-security-report.txt"
    [ -f "security-reports/flutter-analyze-report.txt" ] && echo "Flutter Analyze Report: security-reports/flutter-analyze-report.txt"
    [ -f "security-reports/rust-audit-report.txt" ] && echo "Rust Audit Report: security-reports/rust-audit-report.txt"
    [ -f "security-reports/anchor-test-report.txt" ] && echo "Anchor Test Report: security-reports/anchor-test-report.txt"
fi
