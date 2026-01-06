from setuptools import find_packages, setup

with open("README.md", encoding="utf8", errors="ignore") as fh:
    long_description = fh.read()

setup(
    name="docx-parser-converter",
    version="1.0.0",
    author="Omer Hayun",
    author_email="omerha86@gmail.com",
    description="A library for converting DOCX files to HTML and plain text",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/omer-go/docx-parser-converter",
    packages=find_packages(where="docx_parser_converter_python"),
    package_dir={"": "docx_parser_converter_python"},
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Programming Language :: Python :: 3.13",
        "Operating System :: OS Independent",
        "Topic :: Office/Business",
        "Topic :: Text Processing :: Markup :: HTML",
        "Typing :: Typed",
    ],
    python_requires=">=3.10",
    install_requires=[
        "lxml>=5.0.0",
        "pydantic>=2.0.0",
    ],
)
