# openiod-connect-pull

# Install

## Dependencies
Nodejs
## Application
mkdir <applicationname>/<processname>
cd <applicationname>/<processname>
npm install <processname>
Available processes:
* openiod-connect-pull-process-v2j-v1
* (or git clone https://github.com/openiod/openiod-connect-pull-process-v2j-v1.git)
## Create config file
md openiod-connect-pull-config-<dir>-v1
cp openiod-connect-pull-v1/openiod-config-example.json openiod-connect-pull-config-<dir>-v1/<servicename>.json
Edit the json configfile according to service, source and target  
# run
cd <applicationname>/<processname>
]
Usage: node index [OPTIONS]...

Options:
  -v, --version             output the version number
  -c, --config [type]       Path to config file
  -s, --service [type]      Name of the configfile
  -p, --processpath [type]  Path to processor and controller
  -h, --help                display help for command
e.g.:
node index -h  (get help info)
node index -c 'openiod-connect-pull-config-<dir>-v1' -s '<servicename>' -p 'openiod-connect-pull-process-<processname>-v1'

directories:
- ./openiod-connect-pull-config-<dir>-v1/<servicename>.json (config directory, keep the config save)
  ./openiod-connect-pull-process-<processname>-v1  (contains controller, processor and modules specific to the service)

# license
This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/ or
send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.along with this program.  
If not, see <https://www.gnu.org/licenses/>.
