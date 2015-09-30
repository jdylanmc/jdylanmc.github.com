---
layout: post
title:  "Complex Sitecore Security"
date:   2015-9-30 17:20:46
description: Explanation of how to create an item provider which restricts content based on the logged in user's permissions.
categories:
- sitecore
- security
- 7.2
permalink: sitecore-security-item-provider
---
### First, a little back story...
In one of my recent Sitecore implementations, the security requirements for the content that the end user experienced expanded beyond typical Sitecore roles.  Users were not managed in Sitecore, and instead the organization had it's own identity provider that Sitecore plugged into.  There ended up being an intersection of three primary authorization ideas:

1. What `roles` does the user have?
2. What `department` is the user a part of?
3. What is the user's `organizational context`?  This data was hierarchical in nature and came from a custom CRM.  Think of a hierarchy of companies, each company has divisions, each division has brick and mortar locations, etc.  If you're an executive, you would have visibility over your entire company, but if you're a general user you may only have visibility to your brick and mortar location.  A user could be assigned to any number of nodes within this tree.

For each user, the administration was simple.  The company had their own profile management system which we treated as an identity provider to Sitecore.  The identity provider managed users, their roles, their profile, and their organizational context.  Everything was exposed through a series of API's, so that interaction was natural.

For content authoring, this was a little trickier.  There were a series of requirements that looked something like:

1. For every content item, content authors have the option to specify:
    * Zero or more `roles` that should see this content.
    * Zero or more `departments` that should see this content.
    * Zero or more `organizational contexts` which should see this content.
2. If no security rules are selected from the above, then this content is viewable to everyone.
3. Roles in the profile management system are configurable, and Sitecore should reflect what's configured.
4. Departments in the profile management system are configurable, and Sitecore should reflect what's configured.
5. Organizational Context is dynamic and should come from the CRM.  
6. To determine if a user has access to the selected Organizational context, perform this calculation (If you've taken a data structure course in the past, then the calculation here will feel familiar):
    * Take the organizational nodes selected for the content item and convert them to a list of all leaves beneath those nodes.
    * Take the organizational nodes selected for the user and convert them to a list of all leaves beneath those nodes.
    * If the two lists have any intersecting values, then the user passes this security check.

So, in reality... the rule was simple:

{% highlight csharp %}
// rough pseudo code
public bool UserHasAccess(User user, List<Role> roles, List<Departments> depts, List<Nodes> context)
{
    return user.HasOne(roles) && user.HasOne(depts) && user.Organizations.Contains(context);
}
{% endhighlight %}

Simple enough, right?

----

### So how do we build this in Sitecore?

For this setup, I ended up creating a template called `Security Base`.  On `Security Base`, I have 3 fields: 

1. Roles: a multilist which pulls from Role content items located at /sitecore/content/my-site/site-settings/roles.  Each Role item contains a role key that comes from the Identity Provider.
2. Department: a multilist which pulls from Department content items located at /sitecore/content/my-site/site-settings/departments.  Each Department item contains a department key that comes from the Identity Provider.
3. Organizational Context: an IFrame which pulls from /sitecore/my-site/organizational-context.aspx.  TODO: Blog about this implementation

The idea here is that I can now have any other template inherit from `Security Base`, and can control a derived item's visibility on the end website.  We can achieve this by overriding the Item Provider.  Data Providers in sitecore are generally used to expose data from external systems into the Sitecore CMS.  A data provider could essentially talk to anything.  The Item Provider I'm refering to, is a built in Data Provider in Sitecore which talks to the CMS's database.

To extend or override the built in data provider, you need to make a configuration change:

{% highlight xml %}
<!-- throw this in your App_Config\Include directory and swap out the assembly reference as needed -->
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <itemManager defaultProvider="default">
      <providers>
        <add name="default" type="Sitecore.Data.Managers.ItemProvider, Sitecore.Kernel">
          <patch:attribute name="type">MyWebsite.Providers.SecurityItemProvider.ItemProvider, MyWebsite.Providers</patch:attribute>
        </add>
      </providers>
    </itemManager>
  </sitecore>
</configuration>
{% endhighlight %}

After you do that, Sitecore will look to pull ALL of it's items from MyWebsite.Providers.SecurityItemProvider.ItemProvider.  Keep in mind that EVERY item that is accessed will run through this code, so it needs to be as snappy as you can make it.

My item provider looked something like this:

{% highlight csharp %}
public class SecurityItemProvider : Sitecore.Data.Managers.ItemProvider
{
    // templates have this template ID (in 7.2 at least)
    private const string STANDARD_TEMPLATE_ID = "{AB86861A-6030-46C5-B394-E8F99E8B87DB}";

    // this is your base security template that each item you want to secure would inherit from
    private const string SECURITY_TEMPLATE_ID = "guid of your custom security template";

    // the name of your site from the site config
    private const string WEBSITE_NAME = "website_name"; 

    protected override Item ApplySecurity(Item item, SecurityCheck securityCheck)
    {
        // if this item's a template, just return standard security
        if (item.TemplateID == ID.Parse(STANDARD_TEMPLATE_ID))
        {
            return base.ApplySecurity(item, securityCheck);
        }

        // make sure we have a site context
		// detect if we're running in the target site 
		// make sure the security disabler isn't enabled
		// make sure we're not in page editor
		// make sure this content item inherits from security base 
        if (Context.Site != null 
            && Context.Site.Name.ToLower() == WEBSITE_NAME 
            && securityCheck != SecurityCheck.Disable 
            && Context.PageMode.IsNormal
            && item.IsDerivedFrom(ID.Parse(SECURITY_TEMPLATE_ID)))
        {
			// perform your calculation here to apply whatever security you need.
			// in this case, I have a collection of extension methods to help me.
			// sepcific implementation will be dependent on your use case.
            if (item.HasOrgContextOver(Sitecore.Context.User) 
			    && Context.User.IsInDepartmentFor(item) 
				&& Context.User.HasRolesFor(item))
            {
				// if the user passes the above checks, apply default security
                return base.ApplySecurity(item, securityCheck);
            }
            else
            {
                // trick sitecore into thinking that the item doesn't exist
                return null;
            }
        }

        return base.ApplySecurity(item, securityCheck);
    }
}
{% endhighlight %}

There are a few extension methods I used to determine if an item derives from a template, or if a template derives from another template.  I can't remember where I found these, but I think they come from someone else's blog...

{% highlight csharp %}
public static class ItemExtensions
{
    public static bool IsDerivedFrom([NotNull] this Item item, [NotNull] ID templateId)
    {
        return TemplateManager.GetTemplate(item).IsDerived(templateId);
    }
}

public static class TemplateExtensions
{
    public static bool IsDerived([NotNull] this Template template, [NotNull] ID templateId)
    {
        return template.ID == templateId || template.GetBaseTemplates().Any(baseTemplate => IsDerived(baseTemplate, templateId));
    }
}
{% endhighlight %}

### And that's it!

Keep in mind that I used 3 extension methods above to perform my actual checks.  Here are some of them:

{% highlight csharp %}

public static class ItemExtensions
{
	public static bool HasOrgContextOver([NotNull] this Item item, [NotNull] User user)
	{
		// check if this item has any organizational contexts
		// if it does, check if they intersect with any of the user's organizational contexts
		// if it doesn't, return true/false depending on requirements
		
		// unfortunately, this code is very domain specific, so I'm leaving implementation details out.
	}
}

public static class UserExtensions
{
    public static bool HasRolesFor(this User user, Item item)
    {
        // if this is a CMS user, we short circuit this check and always let them through
        if (user.Domain.Name == "sitecore")
        {
            return true;
        }

        // Roles comes from Security Base
        var field = item.Fields["Roles"];

        // not every item inherits from security base
        if (field != null)
        {
            var roleItems = ((MultilistField)field).GetItems();

            if (!roleItems.Any())
            {
                return true;
            }

            var roleKeys = roleItems.Select(x => x.Fields["Role Key"].ToString().Trim().ToLower()).ToList();

            return user.Roles.Select(x => x.Name.ToLower().Trim()).Intersect(roleKeys).Any();
        }

        return true;
    }
}

{% endhighlight %}

Of course, when my users log into the system I run a set of code that looks something like this...

{% highlight csharp %}
// UserInfo is a poco that contains data obtained from the identity provider
public void Login(UserInfo userInfo) 
{
    // be sure to keep the user's domain as extranet to enforce sitecore security rules on content
    var virtualUser = AuthenticationManager.BuildVirtualUser("extranet\\" + user, true);
    
    virtualUser.Profile.FullName = userInfo.FirstName + " " + userInfo.LastName;
    virtualUser.Profile.Email = userInfo.Email;
    virtualUser.Profile.SetCustomProperty(typeof(OrganizationalContext).Name, userInfo.OrganizationalContext);
    virtualUser.Profile.Save();
    
    foreach (var role in userInfo.Roles)
    {
	    // in this case, RoleKey is an active directory group
        virtualUser.Roles.Add(Role.FromName("extranet\\" + role.RoleKey));
    }
    
	// create the actual sitecore session for the user
    AuthenticationManager.Login(virtualUser);
}
{% endhighlight %}

I hope this helps someone out!  I should also write a blog post around getting that organizational context IFrame into Sitecore...