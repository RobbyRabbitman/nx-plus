#!/bin/sh

# TODO: Workaround for issue https://community.sonarsource.com/t/after-upgrade-to-sonar-to-10-6-error-checksum-verification-failed-for-jre/129056/24
# Sonar scans fail to download the sonar engine when running parallel.
# As a workaround, we run the first sonar scan and then run the rest in parallel.
# When this is fixed, remove this script and run instead just `nx affected -t sonar-scan -c ci ...`

affectedSonarScanProjects=$(pnpm nx show projects --with-target sonar-scan --affected)
affectedSonarScanCount=$(echo $affectedSonarScanProjects | grep "^.*$" -c)

if [ $affectedSonarScanCount -eq 0 ]; then
  exit 0
fi

firstSonarScanProject=$(echo $affectedSonarScanProjects | awk '{print $1}')
pnpm nx run $firstSonarScanProject:sonar-scan -c ci "$@"
pnpm nx affected -t sonar-scan -c ci "$@"
