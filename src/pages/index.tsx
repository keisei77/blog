import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';
import Articles from '../components/articles';

const BlogIndex = (props: any) => {
  const { data } = props;
  const posts = data.allMarkdownRemark.edges;
  return (
    <Layout>
      <>
        <SEO title="Keisei's Blog" />
        <Articles posts={posts} />
      </>
    </Layout>
  );
};

export default BlogIndex;

export const pageQuery = graphql`
  query {
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            description
          }
        }
      }
    }
  }
`;
