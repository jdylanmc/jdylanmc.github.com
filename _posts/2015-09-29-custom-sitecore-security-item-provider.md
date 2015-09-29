---
layout: post
title:  "Complex Sitecore Security"
date:   2015-9-29 14:54:02
description: Explanation of how to create an item provider which restricts content based on the logged in user's permissions.
categories:
- sitecore
- security
permalink: sitecore-security-item-provider
---

## First, a little back story...

In one of my recent Sitecore implementations, the security requirements for the content that the end user experienced expanded beyond typical Sitecore roles.  Users were not managed in Sitecore, and instead the organization had it's own identity provider that Sitecore plugged into.  There ended up being an intersection of three primary authorization ideas:

1. What roles does the user have?
2. What department is the user a part of?
3. What is the user's "organizational context"?  This data was hierarchical in nature and came from a custom CRM.  Think of a hierarchy of companies, each company has divisions, each division has brick and mortar locations, etc.  If you're an executive, you would have visibility over your entire company, but if you're a general user you may only have visibility to your brick and mortar location.  A user could be assigned to any number of nodes within this tree.

For each user, the administration was simple.  The company had their own profile management system which we treated as an identity provider to Sitecore.  The identity provider managed users, their roles, their profile, and their organizational context.  Everything was exposed through a series of API's, so that interaction was natural.

For content authoring, this was a little trickier.  There were a series of requirements that looked something like:

1. For every content item, content authors have the option to specify:
    - Zero or more roles that should see this content.
    - Zero or more departments that should see this content.
    - Zero or more organizational contexts which should see this content.
2. If no security rules are selected from the above, then this content is viewable to everyone.
3. Roles in the profile management system are configurable, and Sitecore should reflect what's configured.
4. Departments in the profile management system are configurable, and Sitecore should reflect what's configured.
5. Organizational Context is dynamic and should come from the CRM.  
6. To determine if a user has access to the selected Organizational context, perform this calculation (If you've taken a data structure course in the past, then the calculation here will feel familiar):
    - Take the organizational nodes selected for the content item and convert them to a list of all leaves beneath those nodes.
    - Take the organizational nodes selected for the user and convert them to a list of all leaves beneath those nodes.
    - If the two lists have any intersecting values, then the user passes this security check.

So, in reality... the rule was simple:

{% highlight csharp %}
// rough pseudo code
public bool UserHasAccess(User user, List<Role> roles, List<Departments> depts, List<Nodes> context)
{
    return user.HasOne(roles) && user.HasOne(departments) && user.Organizations.Contains(context);
}
{% endhighlight %}

Simple enough, right?

----

## So how do we build this in Sitecore?