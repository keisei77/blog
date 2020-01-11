import Bio from '../components/bio';
import React from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';
import { graphql } from 'gatsby';

const About = () => (
  <Layout>
    <>
      <SEO title="Keisei's Blog" />
      <Bio />
    </>
  </Layout>
);

export default About;
