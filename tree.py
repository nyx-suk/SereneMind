import os

def print_tree(startpath, exclude_dirs, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        for root, dirs, files in os.walk(startpath):
            # Exclude specified directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            level = root.replace(startpath, '').count(os.sep)
            indent = ' ' * 4 * (level)
            f.write('{}{}/\n'.format(indent, os.path.basename(root)))
            subindent = ' ' * 4 * (level + 1)
            for file_name in files:
                f.write('{}{}\n'.format(subindent, file_name))

if __name__ == "__main__":
    startpath = r'd:\\mental_health\\app_01\\MentalHealthApp'
    exclude_dirs = {'.git', 'node_modules', '.bundle'}
    output_file = r'd:\\mental_health\\app_01\\raw_tree_utf8.txt'
    print_tree(startpath, exclude_dirs, output_file)
