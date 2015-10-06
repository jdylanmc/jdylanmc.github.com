---
layout: post
title:  "My standard site configuration with 404 and 403 support"
date:   2015-10-05 21:20:46
description: Sample configuration for a Sitecore site.
categories:
- sitecore
- configuration
- beginner
permalink: sitecore-site-configuration
---
### This is a pretty standard configuration that I usually roll with on my sitecore websites.
One of the things you have to do when building a new Sitecore website, is configure Sitecore to know how to resolve your home page and subpages.  It's not enough to point DNS to IIS, and IIS to your Sitecore webroot- you have to also point Sitecore to your content.  To do this, you need a configuration section like so:

{% highlight xml %}
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <sites>
      <site patch:before="site[@name='website']" 
			name="site_name" RequestedAuthnCtx="SITE_CTX" virtualFolder="/"
			physicalFolder="/" requireLogin="false"	loginPage="/path/to/login" 
			rootPath="/sitecore/content/my-site" startItem="/home" database="web"
			domain="extranet" allowDebug="true" cacheHtml="true" 
			htmlCacheSize="10MB" registryCacheSize="0" viewStateCacheSize="0"
			xslCacheSize="5MB" filteredItemsCacheSize="2MB"	enablePreview="true" 
			enableWebEdit="true" enableDebugger="true" disableClientData="false" 
	  />
      <site name="site_name">
        <patch:attribute name="hostName">
		  yoursite.com|*yoursite*.yourdomain.com
		</patch:attribute>
	  </site>
	</sites>
  </sitecore>
</configuration>
{% highlight %}

There are a few tricks in this configuration section that you may find useful:
* For the hostname above, you can use asterisks for wildcards, and pipes for multiple domains.  
* You can point to the master database during development.  This will make it so that you don't have to publish in the middle of your development cycles (you know, code, compile, refresh).
* The loginPage can point to a physical file (like an .aspx file).  You can then configure IIS to have windows authentication (or whatever mode you want) for only that file.  This means you can run a multi site instance where one site uses windows auth, and the other uses forms auth.
* rootPath + startItem are essentially your homepage.  I almost always go with `/sitecore/content/my-site/home`
* In a multisite setup, you can have as many of these site configs as you want.  Just throw each into their own config file!

After you get this configured how you like, you can then setup 404 and 403 pages directly under your home page.  These configurations look like so:

{% highlight xml %}
<?xml version="1.0" encoding="utf-8" ?>
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <settings>
      <setting name="NoAccessUrl" value="/403" />
    </settings>
  </sitecore>
</configuration>
{% highlight %}

And the 404 page is very similar:

{% highlight xml %}
<?xml version="1.0" encoding="utf-8" ?>
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <settings>
      <setting name="ItemNotFoundUrl" value="/404" />
	  <setting name="LinkItemNotFoundUrl" value="/404" />
	  <setting name="RequestErrors.UseServerSideRedirect" value="true" />
    </settings>
  </sitecore>
</configuration>
{% highlight %}

Keep in mind that your 404 and 403 pages will return a 200 status code by default.  To get around this, give them a simple code behind which changes the `Response.StatusCode` and `Response.TrySkipIisCustomErrors` appropriately.  If you're rocking a multisite instance, all sites will resolve /403 and /404 relative to their `rootPath`.

#### Note: every configuration in this blog post should go into your App_Config/Include directory!