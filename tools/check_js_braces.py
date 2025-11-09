import sys
p='f:\\Projektek\\AbacsArt\\assets\\js\\main.js'
s=open(p,'r',encoding='utf-8').read()
stack=[]
pairs={'(':')','{':'}','[':']'}
for i,ch in enumerate(s):
    if ch in '({[':
        stack.append((ch,i))
    elif ch in ')}]':
        if not stack:
            print('Unmatched closing',ch,'at',i)
            sys.exit(1)
        o,oi=stack.pop()
        if pairs[o]!=ch:
            print('Mismatched',o,'at',oi,'with',ch,'at',i)
            sys.exit(1)
if stack:
    o,oi=stack[-1]
    print('Unclosed',o,'at',oi)
    sys.exit(1)
print('All balanced')
