
# updates all .html files copyright year

year = 2019

import os

def getFilePaths(rootDir='.'): # default to local dir
	files = []
	for dirpath, dirnames, filenames in os.walk(rootDir):
		for s in filenames:
			if s.endswith('.html'):
				files.append(os.path.join(os.path.abspath(dirpath),s))              
	return files
		
		
files = getFilePaths()

for file in files:
	with open(file,'r',errors="ignore") as f:
		words = f.read()
		lines = words.split('\n')
		
		for i in range(len(lines)):
			if 'Copyright' in lines[i] and 'John F. Collins III' in lines[i]:
				lines[i] = f'Copyright © John F. Collins III {year}'
				foundCopyRight = True
				break
			
	if foundCopyRight:
		with open(file, 'w') as f:
			f.write('\n'.join(lines))