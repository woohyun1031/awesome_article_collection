from os import listdir
from urllib.parse import quote

readme_file_path = "../README.md"
articles_dir_path = "../articles/"
articles_dir_path_root = "articles/"

title_project = "# Awesome Article Collection"
desc_project = "아래 나열된 아티클과 프로젝트들을 개인적으로 구현해보는 낙서장과 같은 곳입니다."\
    + "\n" + "해당 폴더에서 원본 링크를 확인 할 수 있습니다."

table_header_total = """\
| Total |
| ------------- |\
"""
table_header_articles = """\
| \# | Article
| ------------- | -------------\
"""

article_folders = [f for f in listdir(articles_dir_path)]


def get_table_content_total(articles):
    return "| " + str(len(articles)) + " |"


def get_table_content_articles(articles):
    content = ""
    for i in range(len(articles)):
        content += to_read_me_line(i, articles[i])
    return content


def to_read_me_line(i, name):
    return " | " + str(i + 1)+'.' +\
        " | " + "["+name+"]("+articles_dir_path_root+encode_url(name)+")" +\
        "\n"


def encode_url(input_string):
    encoded_string = quote(input_string)
    return encoded_string


readme = open(readme_file_path, "w")
readme.write(title_project + "\n" + desc_project + "\n\n")
readme.write(table_header_total + "\n" +
             get_table_content_total(article_folders) + "\n\n")
readme.write(table_header_articles + "\n" +
             get_table_content_articles(article_folders))
readme.close()

readme = open(readme_file_path, 'r')
for line in readme.readlines():
    print(line)
readme.close()
