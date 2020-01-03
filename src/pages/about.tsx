import Bio from '../components/bio';
import React from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';
import { graphql } from 'gatsby';

const About = (props: any) => {
  const { data } = props;
  const siteTitle = data.site.siteMetadata.title;
  return (
    <Layout location={props.location} title={siteTitle}>
      <>
        <SEO title="Keisei's Blog" />
        <Bio />
      </>
    </Layout>
  );
};

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`;

export default About;
