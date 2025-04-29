
# updates all .html files copyright year

# update app to work with any arbitrary string

year = 2025

import os
import io

def getFilePaths(rootDir='..'): # default to local dir
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
		
		foundCopyRight = False
		for i in range(len(lines)):
			if 'Copyright' in lines[i] and 'John F. Collins III' in lines[i]:
				lines[i] = f'Copyright ©️ John F. Collins III {year}'
				foundCopyRight = True
				break
			
	if foundCopyRight:
		with io.open(file, 'w', encoding='utf8') as f:
			f.write('\n'.join(lines))